<template>
    <div class="layout-container">
        <el-container>
            <el-aside width="200px">
                <div class="logo">超无穹管理后台</div>
                <el-menu :default-active="route.path" router @select="handleMenuSelect">
                    <el-menu-item index="/dashboard">
                        <el-icon><Odometer /></el-icon>
                        <span>控制台</span>
                    </el-menu-item>
                    <el-menu-item index="/users">
                        <el-icon><User /></el-icon>
                        <span>用户管理</span>
                    </el-menu-item>
                    <el-sub-menu index="gacha">
                        <template #title>
                            <el-icon><Grid /></el-icon>
                            <span>卡池管理</span>
                        </template>
                        <el-menu-item index="/gacha">卡池列表</el-menu-item>
                        <el-menu-item index="/gacha/records">抽卡记录</el-menu-item>
                    </el-sub-menu>
                    <el-menu-item index="/orders">
                        <el-icon><Document /></el-icon>
                        <span>订单管理</span>
                    </el-menu-item>
                    <el-menu-item @click="goToRecharge">
                        <el-icon><Money /></el-icon>
                        <span>充值中心</span>
                    </el-menu-item>
                    <el-menu-item index="/settings">
                        <el-icon><Setting /></el-icon>
                        <span>系统设置</span>
                    </el-menu-item>
                </el-menu>
            </el-aside>
            <el-container>
                <el-header>
                    <div class="header-left">
                        <span class="page-title">{{ route.meta.title }}</span>
                    </div>
                    <div class="header-right">
                        <el-dropdown @command="handleCommand">
                            <span class="user-info">
                                <el-icon><UserFilled /></el-icon>
                                {{ adminInfo?.username || 'Admin' }}
                            </span>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </div>
                </el-header>
                <el-main>
                    <router-view />
                </el-main>
            </el-container>
        </el-container>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Odometer, User, Grid, Document, Setting, UserFilled, Money } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const adminInfo = ref(null)

onMounted(() => {
    const info = localStorage.getItem('adminInfo')
    if (info) {
        adminInfo.value = JSON.parse(info)
    }
})

const handleMenuSelect = (index) => {
    router.push(index)
}

const goToRecharge = () => {
    window.open('http://115.190.158.182/recharge', '_blank')
}

const handleCommand = (command) => {
    if (command === 'logout') {
        ElMessageBox.confirm('确定要退出登录吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
            localStorage.removeItem('adminToken')
            localStorage.removeItem('adminInfo')
            ElMessage.success('已退出登录')
            router.push('/login')
        }).catch(() => {})
    }
}
</script>

<style scoped>
.layout-container {
    height: 100vh;
}

.el-aside {
    background: #304156;
    color: white;
}

.logo {
    height: 60px;
    line-height: 60px;
    text-align: center;
    font-size: 18px;
    font-weight: bold;
    color: white;
    background: #263445;
}

.el-menu {
    border: none;
    background: #304156;
}

.el-menu-item {
    color: #bfcbd9;
}

.el-menu-item:hover,
.el-menu-item.is-active {
    background: #263445 !important;
    color: #409eff !important;
}

:deep(.el-sub-menu__title) {
    color: #bfcbd9;
}

:deep(.el-sub-menu__title:hover) {
    background: #263445 !important;
}

.el-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: white;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.page-title {
    font-size: 18px;
    font-weight: 500;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.el-main {
    background: #f0f2f5;
    padding: 20px;
}
</style>
