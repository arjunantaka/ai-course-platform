<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { marked } from 'marked';
	import { LEVEL_LABELS, STATUS_LABELS } from '$lib/utils';
	import type { PageProps } from './$types';
	import type { CourseStatus } from '$lib/server/db/schema';
	import DeleteModal from '$lib/DeleteModal.svelte';

	let { data }: PageProps = $props();

	// nilai polling menimpa data load selama pipeline berjalan; null berarti belum polling
	type PollState = { done: number; total: number; status: CourseStatus; error: string | null };
	let poll = $state<PollState | null>(null);

	const courseStatus = $derived(poll?.status ?? data.course.status);
	const doneLessons = $derived(poll?.done ?? data.course.doneLessons);
	const totalLessons = $derived(poll?.total ?? data.course.totalLessons);
	const courseError = $derived(poll?.error ?? data.course.error);

	const isGenerating = $derived(
		courseStatus === 'generating_outline' || courseStatus === 'generating_content'
	);

	// polling status tiap 2 detik selama pipeline berjalan
	$effect(() => {
		if (!isGenerating) return;
		const courseId = data.course.id;
		const timer = setInterval(async () => {
			const res = await fetch(`/api/admin/courses/${courseId}/status`);
			if (!res.ok) return;
			const body = (await res.json()) as {
				status: CourseStatus;
				done_lessons: number;
				total_lessons: number;
				error: string | null;
			};
			poll = {
				done: body.done_lessons,
				total: body.total_lessons,
				status: body.status,
				error: body.error ?? null
			};
			if (body.status !== 'generating_outline' && body.status !== 'generating_content') {
				clearInterval(timer);
				await invalidateAll();
			}
		}, 2000);
		return () => clearInterval(timer);
	});

	// editor lesson
	let openPreview = $state<Record<string, boolean>>({});
	let saving = $state<Record<string, boolean>>({});
	let savedFlash = $state<Record<string, number>>({});

	let busy = $state<string | null>(null);
	let actionError = $state<string | null>(null);
	let pendingDelete = $state<{ path: string } | null>(null);

	async function saveLesson(lessonId: string, contentMd: string): Promise<void> {
		saving[lessonId] = true;
		actionError = null;
		try {
			const res = await fetch(`/api/admin/lessons/${lessonId}`, {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ content_md: contentMd })
			});
			if (res.ok) {
				savedFlash[lessonId] = Date.now();
			} else {
				const body = await res.json().catch(() => ({ message: res.statusText }));
				actionError = `Gagal menyimpan: ${body.message ?? 'coba lagi'}`;
			}
		} finally {
			saving[lessonId] = false;
		}
	}

	async function courseAction(path: string, method: 'POST' | 'DELETE'): Promise<void> {
		busy = `${method}:${path}`;
		actionError = null;
		try {
			const res = await fetch(path, { method });
			if (!res.ok) {
				const body = await res.json().catch(() => ({ message: res.statusText }));
				actionError = `Aksi gagal: ${body.message ?? 'coba lagi'}`;
				return;
			}
			if (method === 'DELETE') {
				await goto('/admin');
				return;
			}
			await invalidateAll();
		} finally {
			busy = null;
		}
	}

	const pct = $derived(totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0);
	const reviewNotes = $derived(data.course.reviewNotes);
</script>

<svelte:head>
	<title>{data.course.title} · Admin KrasCourse</title>
</svelte:head>

<div class="flex flex-wrap items-start justify-between gap-4">
	<div class="min-w-0">
		<div class="flex items-center gap-3">
			<h1 class="text-2xl font-extrabold tracking-tight">{data.course.title}</h1>
			<span class="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
				{STATUS_LABELS[courseStatus]}
			</span>
		</div>
		<p class="mt-1 max-w-2xl text-sm text-zinc-500">{data.course.description}</p>
		<p class="mt-2 text-xs text-zinc-500">
			{LEVEL_LABELS[data.course.level]} · bahasa {data.course.language}
			· dibuat {new Date(data.course.createdAt).toISOString().slice(0, 10)}
		</p>
	</div>

	{#if !isGenerating}
		<div class="flex flex-wrap gap-2 text-sm font-semibold">
			{#if courseStatus === 'draft' || courseStatus === 'archived'}
				<button
					onclick={() => courseAction(`/api/admin/courses/${data.course.id}/publish`, 'POST')}
					disabled={busy !== null}
					class="rounded-full bg-teal-600 px-4 py-2 text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
				>
					Terbitkan
				</button>
			{:else if courseStatus === 'published'}
				<button
					onclick={() => courseAction(`/api/admin/courses/${data.course.id}/unpublish`, 'POST')}
					disabled={busy !== null}
					class="rounded-full border border-zinc-300 px-4 py-2 text-zinc-700 transition-colors hover:border-zinc-500 disabled:opacity-50"
				>
					Jadikan draft
				</button>
			{/if}
			<a
				href="/admin"
				class="rounded-full border border-zinc-300 px-4 py-2 text-zinc-700 transition-colors hover:border-zinc-500"
			>
				← Daftar kursus
			</a>
		</div>
	{/if}
</div>

{#if actionError}
	<p class="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{actionError}</p>
{/if}

{#if courseStatus === 'failed' && courseError}
	<div class="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
		<p class="font-semibold">Generate gagal</p>
		<p class="mt-1">{courseError}</p>
		<p class="mt-2 text-xs text-red-500">
			Hapus kursus ini lalu buat ulang dengan topik yang sama bila ingin mencoba kembali.
		</p>
	</div>
{/if}

{#if isGenerating}
	<section class="mt-10 rounded-2xl border border-zinc-200 bg-white p-10 text-center">
		<p class="text-sm font-medium text-zinc-500">
			{courseStatus === 'generating_outline'
				? 'AI sedang menyusun outline kursus…'
				: 'AI sedang menulis materi tiap lesson…'}
		</p>
		{#if courseStatus === 'generating_content'}
			<p class="mt-3 text-3xl font-extrabold text-zinc-900">
				Generate materi: {doneLessons}/{totalLessons} lesson
			</p>
			<div class="mx-auto mt-5 h-2 max-w-sm overflow-hidden rounded-full bg-zinc-100">
				<div class="h-full rounded-full bg-teal-600 transition-all duration-500" style={`width: ${pct}%`}></div>
			</div>
		{/if}
		<p class="mt-4 text-xs text-zinc-500">
			Status diperbarui otomatis setiap 2 detik. Biarkan halaman ini terbuka.
		</p>
	</section>
{:else}
	<section class="mt-6 flex flex-wrap gap-3 text-xs text-zinc-500">
		<span class="rounded-md bg-zinc-100 px-3 py-1.5">{data.modules.length} modul</span>
		<span class="rounded-md bg-zinc-100 px-3 py-1.5">{data.course.totalLessons} lesson</span>
		<span class="rounded-md bg-zinc-100 px-3 py-1.5">{doneLessons} lesson terisi materi</span>
	</section>

	{#if reviewNotes.length > 0}
		<details class="mt-4 rounded-2xl border border-zinc-200 bg-white">
			<summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-zinc-800">
				Catatan review AI ({reviewNotes.length} poin ditiadakan)
			</summary>
			<ul class="space-y-2 border-t border-zinc-100 px-4 py-4">
				{#each reviewNotes as note (note.point)}
					<li class="text-sm text-zinc-700">
						{note.point}
						<span class="block text-xs text-zinc-500">{note.reason}</span>
					</li>
				{/each}
			</ul>
		</details>
	{/if}

	{#each data.modules as mod, mi (mod.id)}
		<section class="mt-8">
			<h2 class="text-lg font-bold text-zinc-900">Modul {mi + 1}: {mod.title}</h2>
			<p class="mt-0.5 text-sm text-zinc-500">{mod.summary}</p>

			{#each mod.lessons as lesson (lesson.id)}
				<details class="mt-3 rounded-2xl border border-zinc-200 bg-white">
					<summary class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm">
						<span class="font-semibold text-zinc-800">
							{lesson.hasContent ? '✓ ' : ''}{lesson.title}
						</span>
						<span class="shrink-0 text-xs text-zinc-500">{lesson.readingMinutes} menit</span>
					</summary>
					<div class="border-t border-zinc-100 px-4 py-4">
						<textarea
							bind:value={lesson.contentMd}
							rows="16"
							placeholder="Materi lesson (markdown)"
							class="w-full rounded-lg border border-zinc-300 bg-white p-3 font-mono text-xs leading-relaxed focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
						></textarea>

						<div class="mt-3 flex flex-wrap items-center gap-3">
							<button
								onclick={() => (openPreview[lesson.id] = !openPreview[lesson.id])}
								class="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-teal-600 hover:text-teal-600"
							>
								{openPreview[lesson.id] ? 'Sembunyikan preview' : 'Preview'}
							</button>
							<button
								onclick={() => saveLesson(lesson.id, lesson.contentMd ?? '')}
								disabled={saving[lesson.id]}
								class="rounded-full bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
							>
								{saving[lesson.id] ? 'Menyimpan…' : 'Simpan'}
							</button>
							{#if savedFlash[lesson.id]}
								<span class="text-xs font-medium text-teal-600">Tersimpan ✓</span>
							{/if}
						</div>

						{#if openPreview[lesson.id]}
							<div class="prose-custom mt-4 max-h-[32rem] overflow-y-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
								<!-- konten admin sendiri; input tepercaya → tanpa sanitize -->
								{@html marked.parse(lesson.contentMd ?? '', { async: false, gfm: true })}
							</div>
						{/if}
					</div>
				</details>
			{/each}

			{#if mod.quizQuestions && mod.quizQuestions.length > 0}
				<details class="mt-3 rounded-2xl border border-teal-200 bg-teal-50/50">
					<summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-teal-800">
						Kuis modul ({mod.quizQuestions.length} soal) · read-only
					</summary>
					<div class="space-y-4 border-t border-teal-100 px-4 py-4">
						{#each mod.quizQuestions as question, qi (qi)}
							<div class="rounded-2xl bg-white p-4 text-sm">
								<p class="font-semibold text-zinc-800">{qi + 1}. {question.question}</p>
								<ol class="mt-2 list-decimal space-y-1 pl-5 text-zinc-600">
									{#each question.options as option, oi (oi)}
										<li class={oi === question.answer_index ? 'font-semibold text-teal-700' : ''}>
											{option}{oi === question.answer_index ? ' ✓' : ''}
										</li>
									{/each}
								</ol>
								<p class="mt-2 text-xs text-zinc-500"><em>{question.explanation}</em></p>
							</div>
						{/each}
					</div>
				</details>
			{/if}
		</section>
	{/each}

	<div class="mt-10 border-t border-zinc-200 pt-6">
		<button
			onclick={() => (pendingDelete = { path: `/api/admin/courses/${data.course.id}` })}
			disabled={busy !== null}
			class="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
		>
			Hapus kursus ini
		</button>
	</div>
{/if}

<DeleteModal
	open={pendingDelete !== null}
	busy={busy !== null}
	onCancel={() => (pendingDelete = null)}
	onConfirm={async () => {
		const path = pendingDelete!.path;
		pendingDelete = null;
		await courseAction(path, 'DELETE');
	}}
/>
