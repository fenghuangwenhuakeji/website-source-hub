import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { apiClient } from '../utils/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const profileSchema = z.object({
  nickname: z.string().min(2, '昵称至少2个字符').max(20, '昵称最多20个字符'),
  bio: z.string().max(200, '简介最多200个字符').optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  birthday: z.string().optional(),
  location: z.string().max(50, '地址最多50个字符').optional(),
  website: z.string().url('请输入有效的网址').optional().or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nickname: user?.nickname || '',
      bio: user?.bio || '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        nickname: user.nickname || '',
        bio: user?.bio || '',
        gender: user?.gender as any,
        birthday: user?.birthday || '',
        location: user?.location || '',
        website: user?.website || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    setMessage('');

    try {
      await apiClient.put('/api/users/profile', data);
      updateUser(data);
      setMessage('资料更新成功');
    } catch (err: any) {
      setMessage(err.response?.data?.error || '更新失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-shell profile-shell bg-[#0f0f0f]">
      <div className="mx-auto max-w-3xl px-4 py-10 pb-16 sm:px-6 sm:py-14 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">个人设置</h1>

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-8">
          {message && (
            <div className="bg-slate-900/70 border border-slate-700 text-sky-300 px-4 py-3 rounded-lg mb-6">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center space-x-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-4xl text-white">
                {user?.nickname?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-white font-semibold">{user?.nickname}</h3>
                <p className="text-gray-500 text-sm">{user?.email || user?.phone || user?.username}</p>
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">昵称</label>
              <input
                {...register('nickname')}
                type="text"
                className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-sky-400 focus:outline-none"
              />
              {errors.nickname && (
                <p className="text-sky-300 text-sm mt-1">{errors.nickname.message}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-300 mb-2">简介</label>
              <textarea
                {...register('bio')}
                rows={3}
                className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-sky-400 focus:outline-none resize-none"
                placeholder="介绍一下自己..."
              />
              {errors.bio && (
                <p className="text-sky-300 text-sm mt-1">{errors.bio.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-gray-300 mb-2">性别</label>
                <select
                  {...register('gender')}
                  className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-sky-400 focus:outline-none"
                >
                  <option value="">未设置</option>
                  <option value="male">男</option>
                  <option value="female">女</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">生日</label>
                <input
                  {...register('birthday')}
                  type="date"
                  className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-sky-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">所在地</label>
              <input
                {...register('location')}
                type="text"
                className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-sky-400 focus:outline-none"
                placeholder="你所在的城市"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">个人网站</label>
              <input
                {...register('website')}
                type="text"
                className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-sky-400 focus:outline-none"
                placeholder="https://yourwebsite.com"
              />
              {errors.website && (
                <p className="text-sky-300 text-sm mt-1">{errors.website.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-800">
              <p className="text-gray-500 text-sm">
                {isDirty ? '有未保存的更改' : '所有更改已保存'}
              </p>
              <button
                type="submit"
                disabled={isLoading || !isDirty}
                className="bg-sky-500 hover:bg-sky-400 disabled:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold"
              >
                {isLoading ? '保存中...' : '保存更改'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
