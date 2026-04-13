import { ArticleStatus } from '@prisma/client'

export interface ArticleFormData {
  title: string
  slug: string
  content: string
  excerpt?: string
  coverImage?: string
  categoryIds: string[]
  status: ArticleStatus
  sortOrder: number
  isRecommended: boolean
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  tagIds: string[]
  createdAt?: string | null
}

export interface CategoryFormData {
  name: string
  slug: string
  description?: string
  order: number
}

export interface TagFormData {
  name: string
  slug: string
}

export interface FriendLinkFormData {
  name: string
  url: string
  avatar?: string
  description?: string
  order: number
  isActive: boolean
}

export interface ProfileFormData {
  nickname?: string
  email: string
  avatarUrl?: string
  bio?: string
}

export interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ParsedArticle {
  title: string
  slug: string
  content: string
  excerpt?: string
  coverImage?: string
  categories: string[]
  tags: string[]
  date?: Date
  updated?: Date
  status?: ArticleStatus
  warnings: string[]
}
