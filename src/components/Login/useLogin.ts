// hooks/useLogin.ts
import { useCallback, useEffect, useState }          from 'react';
import { useAuth, useLoading, useToken, useUser }        from '../../Store/loginStore';
import { login } from '../../Store/api';
import { useToast } from '../Toast';


export const useLogin = () => {

  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const { user, setUser }           = useUser()
  const { setAuth }                 = useAuth()
  const { loading, setLoading }     = useLoading()
  const { token, setToken }         = useToken();
  const toast                       = useToast()


  useEffect(()=>{
    
    const login         = localStorage.getItem("mi.login")
    if( login ){ setUsername( login ); }
    
    const pass          = localStorage.getItem("mi.password")
    if( pass ){ setPassword( pass ); setRememberMe(true)}

  },[])

  const handleLogin                 = useCallback( async (data:any) => {

    setLoading( true )
    
    try {
      const res = await login(data)

      if( res.success ){

        setUser( res.data )
        setToken( res.data.token )
        setAuth( true )

        if(rememberMe){
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


  const handleMemberMe              = useCallback( (data: boolean) => {
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