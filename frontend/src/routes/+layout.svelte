<script lang="ts">
	import '../app.css';
</script>

<main>
	{@render children()}
</main>

<style>
	main {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
</style>
