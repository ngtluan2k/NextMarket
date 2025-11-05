import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAffiliateUser } from '../../../../service/afiliate/affiliate.service';
import { decodeJwtToken } from '../../../../service/auth.helper';

interface JwtPayload {
  sub: number;
}

export default function Affiliate() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAffiliateStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const decoded: JwtPayload = decodeJwtToken(token);
        const userId = decoded.sub;

        const response = await isAffiliateUser(userId);
        const isAffiliate = response.data.is_affiliate;

        if (isAffiliate) {
          navigate('/affiliate/dashboard');
        } else {
          navigate('/affiliate/register');
        }
      } catch (error) {
        alert(error);
        console.error('Error checking affiliate status:', error);
        navigate('/');
      }
    };

    checkAffiliateStatus();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg">Checking affiliate status...</p>
      </div>
    </div>
  );
}
