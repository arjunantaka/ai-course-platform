<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { LEVEL_LABELS, STATUS_LABELS } from '$lib/utils';
	import type { CourseStatus } from '$lib/server/db/schema';
	import DeleteModal from '$lib/DeleteModal.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let busy = $state<string | null>(null);
	let actionError = $state<string | null>(null);
	let pendingDelete = $state<{ path: string } | null>(null);

	const STATUS_BADGES: Record<CourseStatus, string> = {
		generating_outline: 'bg-amber-100 text-amber-700',
		generating_content: 'bg-amber-100 text-amber-700',
		failed: 'bg-red-100 text-red-700',
		draft: 'bg-zinc-100 text-zinc-600',
		published: 'bg-teal-100 text-teal-700',
		archived: 'bg-zinc-100 text-zinc-500'
	};

	const GENERATING = new Set<string>(['generating_outline', 'generating_content']);

	type GenState = { done: number; total: number; status: CourseStatus; error: string | null };
	let generation = $state<Record<string, GenState>>({});

	// polling status tiap 2 detik selama ada baris yang masih di-generate
	$effect(() => {
		const generatingIds = data.courseCards
			.filter((course) => GENERATING.has(course.status))
			.map((course) => course.id);
		if (generatingIds.length === 0) return;

		const timers = generatingIds.map((id) => {
			const timer = setInterval(async () => {
				const res = await fetch(`/api/admin/courses/${id}/status`);
				if (res.status === 404) {
					// kursus dihapus di tempat lain: berhenti mem-poll baris ini
					clearInterval(timer);
					await invalidateAll();
					return;
				}
				if (!res.ok) return;
				const body = await res.json();
				generation[id] = {
					done: body.done_lessons,
					total: body.total_lessons,
					status: body.status,
					error: body.error ?? null
				};
				if (body.status !== 'generating_outline' && body.status !== 'generating_content') {
					// status terminal: hentikan polling baris ini sebelum refresh data
					clearInterval(timer);
					await invalidateAll();
				}
			}, 2000);
			return timer;
		});
		return () => timers.forEach(clearInterval);
	});

	async function callCourseAction(path: string, method: 'POST' | 'DELETE'): Promise<void> {
		busy = `${method}:${path}`;
		actionError = null;
		try {
			const res = await fetch(path, { method });
			if (!res.ok) {
				const body = await res.json().catch(() => ({ message: res.statusText }));
				actionError = `Aksi gagal: ${body.message ?? 'coba lagi'}`;
				return;
			}
			await invalidateAll();
		} finally {
			busy = null;
		}
	}
</script>
<svelte:head>
	<title>Kelola Kursus · KrasCourse</title>
</svelte:head>


<div class="flex flex-wrap items-center justify-between gap-3">
	<h1 class="text-2xl font-extrabold tracking-tight text-zinc-900">Kelola Kursus</h1>
	<a
		href="/admin/new"
		class="inline-flex items-center justify-center rounded-lg bg-teal-700 min-h-[44px] px-5 text-sm font-bold text-white transition-colors hover:bg-teal-800"
	>
		+ Kursus baru
	</a>
</div>

{#if actionError}
	<p class="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{actionError}</p>
{/if}

{#if data.courseCards.length === 0}
	<div class="mt-10 rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
		<p class="font-semibold text-zinc-700">Belum ada kursus. Buat dari topik pertama Anda.</p>
		<a
			href="/admin/new"
			class="mt-4 inline-flex items-center justify-center rounded-lg bg-teal-700 min-h-[44px] px-5 text-sm font-bold text-white transition-colors hover:bg-teal-800"
		>
			Buat kursus pertama
		</a>
	</div>
{:else}
	<div class="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
					<th class="px-4 py-3 font-semibold">Kursus</th>
					<th class="px-4 py-3 font-semibold">Status</th>
					<th class="px-4 py-3 font-semibold">Progres</th>
					<th class="px-4 py-3 font-semibold">Dibuat</th>
					<th class="px-4 py-3 text-right font-semibold">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each data.courseCards as course (course.id)}
					<tr class="border-b border-zinc-100 last:border-0">
						<td class="px-4 py-3">
							<a href={`/admin/${course.id}`} class="inline-flex min-h-[44px] items-center font-semibold hover:text-teal-700">
								{course.title}
							</a>
							<div class="font-mono text-[11px] text-zinc-500">
								{LEVEL_LABELS[course.level]} · {course.moduleCount} modul
							</div>
						</td>
						<td class="px-4 py-3">
							<span
								class="inline-block rounded-md px-2 py-0.5 text-xs font-semibold {STATUS_BADGES[
									generation[course.id]?.status ?? course.status
								]}"
							>
								{STATUS_LABELS[generation[course.id]?.status ?? course.status]}
							</span>
							{#if generation[course.id]?.error}
								<p class="mt-1 text-xs text-red-600">{generation[course.id].error}</p>
							{/if}
						</td>
						<td class="px-4 py-3 text-zinc-600">
							{#if GENERATING.has(generation[course.id]?.status ?? course.status)}
								{#if generation[course.id]}
									{generation[course.id].done}/{generation[course.id].total} lesson
								{:else}
									{course.doneLessons}/{course.totalLessons} lesson
								{/if}
							{:else}
								{course.totalLessons} lesson · {course.totalMinutes} menit
							{/if}
						</td>
						<td class="px-4 py-3 font-mono text-[11px] text-zinc-500">
							{new Date(course.createdAt).toISOString().slice(0, 10)}
						</td>
						<td class="px-4 py-3">
							<div class="flex justify-end gap-2">
								<a
									href={`/admin/${course.id}`}
									class="inline-flex items-center justify-center rounded-lg border border-zinc-300 min-h-[44px] px-5 text-sm font-bold text-zinc-500 transition-colors hover:border-teal-700 hover:text-teal-700"
								>
									Tinjau
								</a>
								{#if course.status === 'draft' || course.status === 'archived'}
									<button
										onclick={() => callCourseAction(`/api/admin/courses/${course.id}/publish`, 'POST')}
										disabled={busy !== null}
										class="inline-flex items-center justify-center rounded-lg bg-teal-700 min-h-[44px] px-5 text-sm font-bold text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
									>
										Terbitkan
									</button>
								{:else if course.status === 'published'}
									<button
										onclick={() => callCourseAction(`/api/admin/courses/${course.id}/unpublish`, 'POST')}
										disabled={busy !== null}
										class="inline-flex items-center justify-center rounded-lg border border-zinc-300 min-h-[44px] px-5 text-sm font-bold text-zinc-500 transition-colors hover:border-teal-700 hover:text-teal-700 disabled:opacity-50"
									>
										Jadikan draft
									</button>
								{/if}
								<button
									onclick={() => (pendingDelete = { path: `/api/admin/courses/${course.id}` })}
									disabled={busy !== null}
									class="inline-flex items-center justify-center rounded-lg border border-red-200 min-h-[44px] px-5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
								>
									Hapus
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<DeleteModal
	open={pendingDelete !== null}
	busy={busy !== null}
	onCancel={() => (pendingDelete = null)}
	onConfirm={async () => {
		const path = pendingDelete!.path;
		pendingDelete = null;
		await callCourseAction(path, 'DELETE');
	}}
/>
