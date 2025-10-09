import { ShoppingBag, Share2, DollarSign, Sparkles } from 'lucide-react';

const steps = [
  {
    icon: ShoppingBag,
    title: 'Tìm sản phẩm',
    description:
      'Duyệt qua hàng nghìn sản phẩm chất lượng trong danh mục của chúng tôi',
    gradient: 'from-orange-500 to-orange-600',
  },
  {
    icon: Share2,
    title: 'Chia sẻ sản phẩm',
    description:
      'Quảng bá sản phẩm đến khán giả của bạn qua các nền tảng mạng xã hội',
    gradient: 'from-orange-600 to-red-500',
  },
  {
    icon: DollarSign,
    title: 'Thu nhập từ các đơn hàng',
    description:
      'Nhận hoa hồng hấp dẫn cho mỗi đơn hàng thành công từ liên kết của bạn',
    gradient: 'from-red-500 to-orange-500',
  },
];

export function RegistrationHero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 py-12 shadow-xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Sparkles className="h-6 w-6 text-white animate-pulse" />
          <h2 className="text-center text-2xl font-bold text-white">
            3 Bước để có Hoa Hồng
          </h2>
          <Sparkles className="h-6 w-6 text-white animate-pulse" />
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${step.gradient} shadow-lg mb-4`}
                >
                  <step.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
