/**
 * Mobile Sidebar Interaction
 * 处理移动端侧边栏的打开、关闭与手势交互
 */

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuBtn = document.getElementById('mobileMenuBtn');
    const navItems = document.querySelectorAll('.nav-item');

    if (!sidebar || !overlay || !menuBtn) return;

    // 打开菜单
    function openSidebar() {
        sidebar.classList.add('active');
        overlay.classList.add('active'); // CSS中配合 opacity transition
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    }

    // 关闭菜单
    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // 切换状态
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sidebar.classList.contains('active')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    // 点击遮罩层关闭
    overlay.addEventListener('click', closeSidebar);

    // 点击导航项自动关闭 (提升体验)
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });

    // 简单的左滑关闭手势 (Touch Events)
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        // 如果侧边栏打开，且向左滑动距离超过 50px
        if (sidebar.classList.contains('active')) {
            if (touchStartX - touchEndX > 50) {
                closeSidebar();
            }
        }
        // 边缘右滑打开 (可选，区域限制在左侧 30px)
        else if (touchStartX < 30 && touchEndX - touchStartX > 50) {
            openSidebar();
        }
    }
});
