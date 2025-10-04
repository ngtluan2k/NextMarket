import Link from 'antd/es/typography/Link';
import { Button } from 'antd';
import { ArrowRight } from 'lucide-react';

export default function Affilate() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">Affiliate Program</h1>
        <p className="text-gray-600 text-lg">Choose your path</p>
        <div className="flex gap-4 justify-center">
          <Link href="/user/affiliate/dashboard">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/user/affiliate/register">
            <Button className="border-orange-500 text-orange-500 hover:bg-orange-50 bg-transparent">
              Register Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
