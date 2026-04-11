#!/usr/bin/env bash
set -euo pipefail

# ============================================================
#  A Plain Blog - Docker 交互式构建与管理脚本
# ============================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ENV_FILE=".env"

# ── Utilities ────────────────────────────────────────────────

info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; }

ask() {
  local prompt="$1"
  local default="${2:-}"
  if [ -n "$default" ]; then
    read -rp "$(echo -e "${BOLD}${prompt}${NC} [${default}]: ")" answer
  else
    read -rp "$(echo -e "${BOLD}${prompt}${NC}: ")" answer
  fi
  echo "${answer:-$default}"
}

ask_password() {
  local prompt="$1"
  local default="${2:-}"
  if [ -n "$default" ]; then
    read -rsp "$(echo -e "${BOLD}${prompt}${NC} [回车使用默认值]: ")" answer
  else
    read -rsp "$(echo -e "${BOLD}${prompt}${NC}: ")" answer
  fi
  echo
  echo "${answer:-$default}"
}

check_docker() {
  if ! command -v docker &>/dev/null; then
    error "未检测到 Docker，请先安装 Docker"
    exit 1
  fi
  if ! docker info &>/dev/null 2>&1; then
    error "Docker 未运行，请先启动 Docker"
    exit 1
  fi
}

get_db_mode() {
  if [ -f "$ENV_FILE" ] && grep -q "POSTGRES_USER" "$ENV_FILE"; then
    echo "builtin"
  else
    echo "external"
  fi
}

# ── Configure ────────────────────────────────────────────────

configure() {
  echo ""
  echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
  echo -e "${BOLD}       A Plain Blog - Docker 配置向导${NC}"
  echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
  echo ""

  # Load existing values as defaults
  local db_url="" pg_user="plain_blog" pg_pass="" pg_db="plain_blog"
  local auth_secret="" auth_url="http://localhost:3000"
  local oss_region="oss-cn-hangzhou" oss_bucket="" oss_ak="" oss_sk="" oss_arn=""

  if [ -f "$ENV_FILE" ]; then
    info "检测到已有 .env 文件，当前值将作为默认值"
    db_url=$(grep "^DATABASE_URL=" "$ENV_FILE" 2>/dev/null | head -1 | sed 's/^DATABASE_URL=//' | tr -d '"' || true)
    pg_user=$(grep "^POSTGRES_USER=" "$ENV_FILE" 2>/dev/null | head -1 | sed 's/^POSTGRES_USER=//' | tr -d '"' || echo "plain_blog")
    pg_pass=$(grep "^POSTGRES_PASSWORD=" "$ENV_FILE" 2>/dev/null | head -1 | sed 's/^POSTGRES_PASSWORD=//' | tr -d '"' || true)
    pg_db=$(grep "^POSTGRES_DB=" "$ENV_FILE" 2>/dev/null | head -1 | sed 's/^POSTGRES_DB=//' | tr -d '"' || echo "plain_blog")
    auth_secret=$(grep "^NEXTAUTH_SECRET=" "$ENV_FILE" 2>/dev/null | head -1 | sed 's/^NEXTAUTH_SECRET=//' | tr -d '"' || true)
    auth_url=$(grep "^NEXTAUTH_URL=" "$ENV_FILE" 2>/dev/null | head -1 | sed 's/^NEXTAUTH_URL=//' | tr -d '"' || echo "http://localhost:3000")
    oss_region=$(grep "^OSS_REGION=" "$ENV_FILE" 2>/dev/null | head -1 | sed 's/^OSS_REGION=//' | tr -d '"' || echo "oss-cn-hangzhou")
    oss_bucket=$(grep "^OSS_BUCKET=" "$ENV_FILE" 2>/dev/null | head -1 | sed 's/^OSS_BUCKET=//' | tr -d '"' || true)
    oss_ak=$(grep "^OSS_ACCESS_KEY_ID=" "$ENV_FILE" 2>/dev/null | head -1 | sed 's/^OSS_ACCESS_KEY_ID=//' | tr -d '"' || true)
    oss_sk=$(grep "^OSS_ACCESS_KEY_SECRET=" "$ENV_FILE" 2>/dev/null | head -1 | sed 's/^OSS_ACCESS_KEY_SECRET=//' | tr -d '"' || true)
    oss_arn=$(grep "^OSS_ROLE_ARN=" "$ENV_FILE" 2>/dev/null | head -1 | sed 's/^OSS_ROLE_ARN=//' | tr -d '"' || true)
  fi

  # ── Step 1: Database Mode ──
  echo -e "\n${CYAN}── Step 1/4: 数据库模式 ──${NC}"
  echo "  1) 使用内置 PostgreSQL（推荐，Docker 自动管理数据库）"
  echo "  2) 使用外部 PostgreSQL（连接已有的数据库实例）"
  echo ""
  local mode
  mode=$(ask "请选择" "1")
  local use_builtin=true
  if [ "$mode" = "2" ]; then
    use_builtin=false
  fi

  # ── Step 2: Database Config ──
  echo -e "\n${CYAN}── Step 2/4: 数据库配置 ──${NC}"
  if $use_builtin; then
    pg_user=$(ask "  PostgreSQL 用户名" "$pg_user")
    pg_pass=$(ask_password "  PostgreSQL 密码" "$pg_pass")
    if [ -z "$pg_pass" ]; then
      pg_pass=$(openssl rand -base64 16 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n1)
      info "已自动生成随机密码"
    fi
    pg_db=$(ask "  PostgreSQL 数据库名" "$pg_db")
    db_url="postgresql://${pg_user}:${pg_pass}@db:5432/${pg_db}"
    success "DATABASE_URL: ${db_url}"
  else
    echo "  请输入完整的外部数据库连接地址"
    echo "  格式: postgresql://用户名:密码@主机:端口/数据库名"
    db_url=$(ask "  DATABASE_URL" "$db_url")
    while [ -z "$db_url" ]; do
      error "DATABASE_URL 不能为空"
      db_url=$(ask "  DATABASE_URL")
    done
  fi

  # ── Step 3: NextAuth ──
  echo -e "\n${CYAN}── Step 3/4: NextAuth 认证配置 ──${NC}"
  auth_secret=$(ask "  NEXTAUTH_SECRET（密钥）" "$auth_secret")
  if [ -z "$auth_secret" ]; then
    auth_secret=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n1)
    info "已自动生成 NEXTAUTH_SECRET"
  fi
  auth_url=$(ask "  NEXTAUTH_URL（站点地址）" "$auth_url")

  # ── Step 4: Aliyun OSS ──
  echo -e "\n${CYAN}── Step 4/4: 阿里云 OSS（可选，回车跳过） ──${NC}"
  oss_region=$(ask "  OSS_REGION" "$oss_region")
  oss_bucket=$(ask "  OSS_BUCKET" "$oss_bucket")
  oss_ak=$(ask "  OSS_ACCESS_KEY_ID" "$oss_ak")
  oss_sk=$(ask "  OSS_ACCESS_KEY_SECRET" "$oss_sk")
  oss_arn=$(ask "  OSS_ROLE_ARN" "$oss_arn")

  # ── Write .env ──
  echo ""
  {
    echo "# 数据库"
    echo "DATABASE_URL=\"${db_url}\""
    echo ""
    if $use_builtin; then
      echo "# 内置 PostgreSQL 配置"
      echo "POSTGRES_USER=${pg_user}"
      echo "POSTGRES_PASSWORD=${pg_pass}"
      echo "POSTGRES_DB=${pg_db}"
      echo ""
    fi
    echo "# NextAuth"
    echo "NEXTAUTH_SECRET=\"${auth_secret}\""
    echo "NEXTAUTH_URL=\"${auth_url}\""
    echo ""
    echo "# 阿里云 OSS"
    echo "OSS_REGION=\"${oss_region}\""
    echo "OSS_BUCKET=\"${oss_bucket}\""
    echo "OSS_ACCESS_KEY_ID=\"${oss_ak}\""
    echo "OSS_ACCESS_KEY_SECRET=\"${oss_sk}\""
    echo "OSS_ROLE_ARN=\"${oss_arn}\""
  } > "$ENV_FILE"

  success ".env 配置已保存"
}

# ── Actions ──────────────────────────────────────────────────

do_build() {
  info "开始构建 Docker 镜像..."
  docker compose build || { error "构建失败"; return 1; }
  success "镜像构建完成"
}

do_start() {
  local mode
  mode=$(get_db_mode)
  if [ "$mode" = "builtin" ]; then
    info "启动服务（内置数据库模式）..."
    docker compose --profile builtin-db up -d || { error "启动失败"; return 1; }
  else
    info "启动服务（外部数据库模式）..."
    docker compose up -d || { error "启动失败"; return 1; }
  fi
  success "服务已启动"
  do_status
}

do_stop() {
  info "停止服务..."
  docker compose --profile builtin-db down || { error "停止失败"; return 1; }
  success "服务已停止"
}

do_status() {
  echo ""
  docker compose --profile builtin-db ps
}

do_logs() {
  local service
  echo "选择查看日志的服务:"
  echo "  1) app   - 应用服务"
  echo "  2) db    - 数据库服务"
  echo "  3) 全部"
  local choice
  choice=$(ask "请选择" "3")
  case "$choice" in
    1) docker compose logs -f app ;;
    2) docker compose --profile builtin-db logs -f db ;;
    *) docker compose --profile builtin-db logs -f ;;
  esac
}

do_migrate() {
  info "执行数据库迁移..."
  local mode
  mode=$(get_db_mode)
  if [ "$mode" = "builtin" ]; then
    docker compose --profile builtin-db exec app npx prisma migrate deploy || { error "迁移失败"; return 1; }
  else
    docker compose exec app npx prisma migrate deploy || { error "迁移失败"; return 1; }
  fi
  success "数据库迁移完成"
}

do_reconfigure() {
  configure
}

# ── Main Menu ────────────────────────────────────────────────

show_menu() {
  echo ""
  echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
  echo -e "${BOLD}       A Plain Blog - Docker 管理面板${NC}"
  echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
  echo ""
  echo "  1) 构建镜像"
  echo "  2) 启动服务"
  echo "  3) 停止服务"
  echo "  4) 查看状态"
  echo "  5) 查看日志"
  echo "  6) 数据库迁移"
  echo "  7) 重新配置"
  echo "  0) 退出"
  echo ""
}

main() {
  check_docker

  # First run: auto configure
  if [ ! -f "$ENV_FILE" ]; then
    warn "未检测到 .env 配置文件，进入配置向导"
    configure
    echo ""
  fi

  while true; do
    show_menu
    local choice
    choice=$(ask "请选择操作" "0")
    case "$choice" in
      1) do_build ;;
      2) do_start ;;
      3) do_stop ;;
      4) do_status ;;
      5) do_logs ;;
      6) do_migrate ;;
      7) do_reconfigure ;;
      0) info "再见！"; exit 0 ;;
      *) error "无效选择: $choice" ;;
    esac
  done
}

main "$@"
