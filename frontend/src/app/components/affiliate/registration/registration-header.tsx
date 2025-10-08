import { ShoppingBag, User } from "lucide-react"
import { Button, Dropdown, MenuProps, message } from "antd"
import { useEffect, useState } from "react"

export function RegistrationHeader() {
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData))
      } catch {
        console.error("Không thể parse user từ localStorage")
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    message.success("Đã đăng xuất")
    window.location.href = "/login" // hoặc redirect về trang chủ
  }

  const menuItems: MenuProps["items"] = [
    {
      key: "dashboard",
      label: <a href="/dashboard">Trang cá nhân</a>,
    },
    {
      key: "logout",
      label: <span onClick={handleLogout}>Đăng xuất</span>,
    },
  ]

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 shadow-lg">
              <ShoppingBag className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-orange-500">
                CHƯƠNG TRÌNH AFFILIATES
              </h1>
              <p className="text-xs text-gray-600 font-medium">Tiếp thị liên kết</p>
            </div>
          </a>

          {/* Phần bên phải */}
          <div className="flex items-center gap-6 text-sm">
            <button className="text-gray-600 hover:text-orange-500 transition-colors font-medium">
              Trung tâm Hỗ trợ
            </button>

            {currentUser ? (
              <Dropdown menu={{ items: menuItems }} placement="bottomRight">
                <div className="flex items-center gap-2 cursor-pointer">
                  <User className="w-5 h-5 text-orange-500" />
                  <span className="font-medium text-gray-700">
                    {currentUser.full_name}
                  </span>
                </div>
              </Dropdown>
            ) : (
              <a href="/login">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  Đăng nhập
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
