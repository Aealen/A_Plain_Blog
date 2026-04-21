'use client'
import { useState, useEffect } from 'react'
import { getUserProfile, updateProfile, updatePassword } from '@/actions/admin/user'
import FileUploader from '@/components/admin/FileUploader'

interface UserProfile {
  id: string
  username: string
  email: string
  nickname: string | null
  avatarUrl: string | null
  bio: string | null
  role: string
}

const inputClass = "w-full px-3 py-2 border border-white/10 rounded-[4px] bg-[#2d2d2d] text-white focus:outline-none focus:border-[#3cffd0] transition-colors"

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileForm, setProfileForm] = useState({
    username: '',
    nickname: '',
    email: '',
    avatarUrl: '',
    bio: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' })
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' })

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const data = await getUserProfile()
    if (data) {
      setProfile(data)
      setProfileForm({
        username: data.username,
        nickname: data.nickname || '',
        email: data.email,
        avatarUrl: data.avatarUrl || '',
        bio: data.bio || '',
      })
    }
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProfileMsg({ type: '', text: '' })
    try {
      await updateProfile(profileForm)
      setProfileMsg({ type: 'success', text: '个人资料已更新' })
      await loadProfile()
    } catch (err) {
      setProfileMsg({ type: 'error', text: err instanceof Error ? err.message : '更新失败' })
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasswordMsg({ type: '', text: '' })
    try {
      await updatePassword(passwordForm)
      setPasswordMsg({ type: 'success', text: '密码已更新' })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err instanceof Error ? err.message : '更新失败' })
    }
  }

  if (!profile) {
    return <div className="text-center py-12 text-muted-foreground">加载中...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-display uppercase tracking-[1px] text-foreground mb-6">个人设置</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#2d2d2d] border border-white/10 rounded-[20px] p-6">
          <h2 className="text-base font-bold font-display text-foreground mb-4">基本信息</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileMsg.text && (
              <div className={`p-3 rounded-[4px] text-sm ${profileMsg.type === 'success' ? 'bg-[#3cffd0]/10 text-[#3cffd0]' : 'bg-red-500/10 text-red-400'}`}>
                {profileMsg.text}
              </div>
            )}
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">用户名</label>
              <input type="text" value={profileForm.username} onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })} required className={inputClass} />
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">昵称</label>
              <input type="text" value={profileForm.nickname} onChange={(e) => setProfileForm({ ...profileForm, nickname: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">邮箱</label>
              <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} required className={inputClass} />
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">头像</label>
              {profileForm.avatarUrl && (
                <div className="mb-2">
                  <img src={profileForm.avatarUrl} alt="头像预览" className="w-16 h-16 rounded-full object-cover border border-white/10" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
              <div className="mb-2">
                <input type="url" value={profileForm.avatarUrl} onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })} placeholder="或手动输入头像 URL" className={inputClass} />
              </div>
              <FileUploader onUpload={(url) => setProfileForm({ ...profileForm, avatarUrl: url })} accept="image/*" purpose="avatars" />
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">个人简介</label>
              <textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} rows={3} className={inputClass} />
            </div>
            <button type="submit" className="w-full bg-[#3cffd0] text-black py-2 rounded-[24px] font-mono uppercase hover:bg-[#3cffd0]/90 transition-colors">
              保存修改
            </button>
          </form>
        </div>

        <div className="bg-[#2d2d2d] border border-white/10 rounded-[20px] p-6">
          <h2 className="text-base font-bold font-display text-foreground mb-4">修改密码</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordMsg.text && (
              <div className={`p-3 rounded-[4px] text-sm ${passwordMsg.type === 'success' ? 'bg-[#3cffd0]/10 text-[#3cffd0]' : 'bg-red-500/10 text-red-400'}`}>
                {passwordMsg.text}
              </div>
            )}
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">当前密码</label>
              <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required className={inputClass} />
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">新密码</label>
              <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required minLength={8} className={inputClass} />
            </div>
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1">确认新密码</label>
              <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required minLength={8} className={inputClass} />
            </div>
            <button type="submit" className="w-full bg-[#3cffd0] text-black py-2 rounded-[24px] font-mono uppercase hover:bg-[#3cffd0]/90 transition-colors">
              更新密码
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
