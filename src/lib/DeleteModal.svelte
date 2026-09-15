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
		<div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
			<h2 class="text-lg font-bold text-zinc-900">Hapus kursus</h2>
			<p class="mt-2 text-sm text-zinc-600">Semua modul, lesson, dan kuis ikut terhapus.</p>
			<div class="mt-6 flex justify-end gap-2 text-sm font-semibold">
				<button
					onclick={onCancel}
					class="rounded-full border border-zinc-300 px-4 py-2 text-zinc-700 transition-colors hover:border-zinc-500"
				>
					Batal
				</button>
				<button
					onclick={onConfirm}
					disabled={busy}
					class="rounded-full bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
				>
					Hapus
				</button>
			</div>
		</div>
	</div>
{/if}
