import Link from "antd/es/typography/Link"
import { ShoppingBag } from "lucide-react"
import { Button } from "antd"

export function RegistrationHeader() {
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 shadow-lg">
              <ShoppingBag className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-orange-500">CHƯƠNG TRÌNH AFFILIATES</h1>
              <p className="text-xs text-gray-600 font-medium">Tiếp thị liên kết</p>
            </div>
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <button className="text-gray-600 hover:text-orange-500 transition-colors font-medium">
              Trung tâm Hỗ trợ
            </button>
            <Link href="/dashboard">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">Đăng nhập</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
