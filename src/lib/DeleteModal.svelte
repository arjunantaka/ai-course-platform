<script lang="ts">
	let {
		open,
		busy = false,
		onCancel,
		onConfirm
	}: { open: boolean; busy?: boolean; onCancel: () => void; onConfirm: () => void } = $props();
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4">
		<div class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
			<h2 class="text-lg font-bold text-zinc-900">Hapus kursus</h2>
			<p class="mt-2 text-sm text-zinc-600">Semua modul, lesson, dan kuis ikut terhapus.</p>
			<div class="mt-6 flex justify-end gap-2 text-sm font-semibold">
				<button
					onclick={onCancel}
					class="inline-flex items-center justify-center rounded-lg border border-zinc-300 min-h-[44px] px-5 text-sm font-bold text-zinc-500 transition-colors hover:border-teal-700 hover:text-teal-700"
				>
					Batal
				</button>
				<button
					onclick={onConfirm}
					disabled={busy}
					class="inline-flex items-center justify-center rounded-lg bg-red-600 min-h-[44px] px-5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
				>
					Hapus
				</button>
			</div>
		</div>
	</div>
{/if}
