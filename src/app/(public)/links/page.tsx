import { getActiveFriendLinks } from '@/actions/public/friendLink'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '友情链接',
  description: '友情链接',
}

export default async function LinksPage() {
  const links = await getActiveFriendLinks()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">友情链接</h1>

      {links.length === 0 ? (
        <p className="text-gray-500 text-center py-12">暂无友情链接</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-center gap-4 mb-3">
                {link.avatar ? (
                  <img
                    src={link.avatar}
                    alt={link.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                    {link.name.charAt(0)}
                  </div>
                )}
                <h2 className="text-lg font-semibold text-gray-900">{link.name}</h2>
              </div>
              {link.description && (
                <p className="text-gray-500 text-sm line-clamp-2">{link.description}</p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
