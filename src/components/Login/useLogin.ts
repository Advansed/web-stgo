// hooks/useLogin.ts
import { useCallback, useEffect, useState }          from 'react';
import { useAuth, useLoading, useToken, useUser }        from '../../Store/loginStore';
import { post } from '../../Store/api';
import { useToast } from '../Toast';

export const formatSum            = (sum: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2
  }).format(sum);
};

export const getTotalDebt         = (debts: any): number => {
  return debts.reduce((total: number, debt: any) => total + debt.sum, 0);
};

export const formatUUID           = (uuid: string): string => {
  // Предполагается использование f_encode_uuid/f_decode_uuid из базы
  return uuid;
};

export const formatAddress        = (address: string): string => {
  return address.replace(/,\s*/g, ', ');
};

export const formatDate           = (dateString: string): string => {
  if (!dateString || dateString === 'не указано') return 'не указано';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  } catch {
    return dateString;
  }
};

export const hasActiveDebts       = (debts: any): boolean => {
  return debts.some((debt: any) => debt.sum > 0);
};

export const getDebtStatus        = (debts: any): any => {
  const total = getTotalDebt(debts);
  if (total === 0) return 'none';
  return total > 0 ? 'positive' : 'negative';
};


export const useLogin = () => {

  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const { user, setUser }           = useUser()
  const { setAuth }           = useAuth()
  const { loading, setLoading }     = useLoading()
  const { token, setToken }         = useToken();
  const toast                       = useToast()


  useEffect(()=>{
    
    const login         = localStorage.getItem("mi.login")
    if( login ){ setUsername( login ); }
    
    const pass          = localStorage.getItem("mi.password")
    if( pass ){ setPassword( pass ); setRememberMe(true)}

  },[])

  const handleLogin     = useCallback( async (data:any) => {

    setLoading( true )
    
    try {
      const res = await post("login", data )
      
      console.log( res )  

      if( res.success ){

        setUser( res.data )
        setToken( res.data.token )
        setAuth( true )

        if(rememberMe){
          console.log('member')
          localStorage.setItem("mi.login", data.login )
          localStorage.setItem("mi.password", data.password )
        }

      } else toast.error( res.message)

    } catch(e: any) {

      toast.error( e.message )

    } finally {

      setLoading( false )

    }

    
  }, [rememberMe, password, username]);


  const handleMemberMe  = useCallback( (data: boolean) => {
      console.log("member", data)
      if(!data){
        localStorage.removeItem("mi.login")  
        localStorage.removeItem("mi.password")  
      }; setRememberMe( data )

  }, []);


  return {
    // State
    username, setUsername, password, setPassword,
    rememberMe, handleMemberMe,
    user,
    token,
    loading,

    login: handleLogin

  };
};