#!/bin/bash

# PayPal订阅系统快速启动脚本
# 用于快速设置和测试整个系统

set -e  # 遇到错误立即退出

echo "🚀 PayPal订阅系统快速启动"
echo "=========================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查必要的工具
check_dependencies() {
    log_info "检查系统依赖..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    log_success "Node.js 已安装: $(node --version)"
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    log_success "npm 已安装: $(npm --version)"
    
    # 检查curl
    if ! command -v curl &> /dev/null; then
        log_error "curl 未安装"
        exit 1
    fi
    log_success "curl 已安装"
    
    # 检查jq (可选)
    if ! command -v jq &> /dev/null; then
        log_warning "jq 未安装，建议安装以便更好地处理JSON"
    else
        log_success "jq 已安装"
    fi
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    if [ ! -f "package.json" ]; then
        log_error "package.json 不存在，请确保在项目根目录运行此脚本"
        exit 1
    fi
    
    npm install
    log_success "依赖安装完成"
}

# 检查环境变量
check_environment() {
    log_info "检查环境变量..."
    
    # 检查PayPal配置
    if [ -z "$PAYPAL_CLIENT_ID" ]; then
        log_warning "PAYPAL_CLIENT_ID 未设置"
        echo "请设置环境变量或在 .env 文件中配置"
    else
        log_success "PAYPAL_CLIENT_ID 已设置"
    fi
    
    if [ -z "$PAYPAL_CLIENT_SECRET" ]; then
        log_warning "PAYPAL_CLIENT_SECRET 未设置"
    else
        log_success "PAYPAL_CLIENT_SECRET 已设置"
    fi
    
    # 检查数据库配置
    if [ -z "$SUPABASE_URL" ]; then
        log_warning "SUPABASE_URL 未设置"
    else
        log_success "SUPABASE_URL 已设置"
    fi
}

# 验证PayPal配置
verify_paypal_config() {
    log_info "验证PayPal配置..."
    
    # 检查产品配置文件
    if [ -f "paypal_product_ids.json" ]; then
        log_success "PayPal产品配置文件存在"
        
        # 显示产品信息
        if command -v jq &> /dev/null; then
            echo "产品信息:"
            jq '.pro_plan.product_id, .max_plan.product_id' paypal_product_ids.json
        fi
    else
        log_warning "PayPal产品配置文件不存在"
        echo "请先运行 ./create_paypal_products.sh 创建产品"
    fi
    
    # 检查订阅计划配置文件
    if [ -f "paypal_subscription_plans.json" ]; then
        log_success "PayPal订阅计划配置文件存在"
        
        # 显示计划信息
        if command -v jq &> /dev/null; then
            echo "订阅计划信息:"
            jq '.pro_plan.plan_id, .max_plan.plan_id' paypal_subscription_plans.json
        fi
    else
        log_warning "PayPal订阅计划配置文件不存在"
        echo "请先运行 ./create_subscription_plans.sh 创建订阅计划"
    fi
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    npm run build
    log_success "项目构建完成"
    
    # 检查public目录
    if [ -d "public" ]; then
        log_success "public 目录存在"
        echo "文件列表:"
        ls -la public/
    else
        log_error "public 目录不存在"
        exit 1
    fi
}

# 运行测试
run_tests() {
    log_info "运行集成测试..."
    
    if [ -f "test_paypal_integration.js" ]; then
        node test_paypal_integration.js
        
        if [ $? -eq 0 ]; then
            log_success "所有测试通过"
        else
            log_error "部分测试失败，请检查配置"
            return 1
        fi
    else
        log_warning "测试文件不存在，跳过测试"
    fi
}

# 启动本地服务器 (如果可用)
start_local_server() {
    log_info "检查本地开发服务器..."
    
    if command -v vercel &> /dev/null; then
        log_info "启动Vercel开发服务器..."
        echo "请在新终端中运行: vercel dev"
        echo "然后访问: http://localhost:3000/pricing.html"
    else
        log_warning "Vercel CLI 未安装"
        echo "请安装: npm i -g vercel"
        echo "或使用其他方式启动本地服务器"
    fi
}

# 显示部署信息
show_deployment_info() {
    log_info "部署信息"
    echo "===================="
    echo "🌐 网站地址: https://fluxkrea.me"
    echo "💳 订阅页面: https://fluxkrea.me/pricing.html"
    echo "🔗 Webhook: https://fluxkrea.me/api/paypal-webhook"
    echo ""
    echo "📋 PayPal配置:"
    if [ -f "paypal_subscription_plans.json" ] && command -v jq &> /dev/null; then
        echo "Pro Plan: $(jq -r '.pro_plan.plan_id' paypal_subscription_plans.json) (\$$(jq -r '.pro_plan.price' paypal_subscription_plans.json)/月)"
        echo "Max Plan: $(jq -r '.max_plan.plan_id' paypal_subscription_plans.json) (\$$(jq -r '.max_plan.price' paypal_subscription_plans.json)/月)"
    fi
    echo ""
    echo "📚 文档:"
    echo "- 测试指南: test_subscription_flow.md"
    echo "- 部署清单: deployment_checklist.md"
    echo "- 生产部署: production_deployment.md"
}

# 主菜单
show_menu() {
    echo ""
    echo "请选择操作:"
    echo "1) 完整设置 (推荐新用户)"
    echo "2) 仅检查配置"
    echo "3) 运行测试"
    echo "4) 构建项目"
    echo "5) 显示部署信息"
    echo "6) 退出"
    echo ""
    read -p "请输入选项 (1-6): " choice
}

# 完整设置流程
full_setup() {
    log_info "开始完整设置流程..."
    
    check_dependencies
    install_dependencies
    check_environment
    verify_paypal_config
    build_project
    
    log_info "运行集成测试..."
    if run_tests; then
        log_success "设置完成！系统准备就绪。"
        show_deployment_info
    else
        log_warning "设置完成，但部分测试失败。请检查配置。"
    fi
}

# 主函数
main() {
    echo ""
    echo "当前目录: $(pwd)"
    echo "时间: $(date)"
    echo ""
    
    # 如果有命令行参数，直接执行对应操作
    if [ $# -gt 0 ]; then
        case $1 in
            "setup"|"full")
                full_setup
                ;;
            "check")
                check_dependencies
                check_environment
                verify_paypal_config
                ;;
            "test")
                run_tests
                ;;
            "build")
                build_project
                ;;
            "info")
                show_deployment_info
                ;;
            *)
                echo "未知参数: $1"
                echo "可用参数: setup, check, test, build, info"
                exit 1
                ;;
        esac
        return
    fi
    
    # 交互式菜单
    while true; do
        show_menu
        
        case $choice in
            1)
                full_setup
                ;;
            2)
                check_dependencies
                check_environment
                verify_paypal_config
                ;;
            3)
                run_tests
                ;;
            4)
                build_project
                ;;
            5)
                show_deployment_info
                ;;
            6)
                log_info "退出"
                exit 0
                ;;
            *)
                log_error "无效选项，请输入 1-6"
                ;;
        esac
        
        echo ""
        read -p "按回车键继续..."
    done
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi