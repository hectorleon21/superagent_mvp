<script lang="ts">
  import { page } from '$app/stores';
  
  const navItems = [
    {
      id: 'pre-venta',
      icon: '📋',
      label: 'Pre-Venta',
      href: '/pre-venta'
    },
    {
      id: 'venta',
      icon: '💰',
      label: 'Venta',
      href: '/venta'
    },
    {
      id: 'post-venta',
      icon: '✅',
      label: 'Post-Venta',
      href: '/post-venta'
    },
    {
      id: 'neorag',
      icon: '🧠',
      label: 'NeoRAG',
      href: '/neorag'
    },
    {
      id: 'tablero',
      icon: '📊',
      label: 'Tablero',
      href: '/tablero'
    },
    {
      id: 'cuenta',
      icon: '⚙️',
      label: 'Cuenta',
      href: '/cuenta'
    }
  ];
  
  $: currentPath = $page.url.pathname;
</script>

<nav class="bottom-nav">
  <div class="grid grid-cols-6 h-full">
    {#each navItems as item}
      <a 
        href={item.href}
        class="bottom-nav-item"
        class:active={currentPath.startsWith(item.href)}
        data-sveltekit-preload-data="hover"
      >
        <span class="text-lg">{item.icon}</span>
        <span class="text-xs">{item.label}</span>
      </a>
    {/each}
  </div>
</nav> 