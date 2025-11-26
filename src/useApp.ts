// hooks/useLogin.ts
import { useEffect }          from 'react';
import { useAuth, useToken } from './Store/loginStore';
import { post } from './Store/api';
import { useData, useLoading } from './Store/licsStore';
import { useInvoices } from './Store/invoiceStore';
import { useWorkers } from './Store/navigationStore';


export const useApp = () => {

  const { auth }                  = useAuth()
  const { token }                 = useToken();

  const { setLoading }            = useLoading()
  const { setData: setLics }      = useData()
  const { setData: setInvoices }  = useInvoices()
  const { setWorkers }            = useWorkers()

  useEffect(()=>{
    if( auth ){

        get_lics( token )

        get_invoices( token )

        get_workers( token )
    }  
  },[auth])

  const get_lics                    = async (token ) => {

    const res = await post("get_lics", { token })
    console.log("get_lics App...", res.data )
    if( res.success ) setLics( res.data )

  }

  const get_invoices                = async (token ) => {

    const res = await post("get_invoices", { token })
    console.log("get_invoices App...", res.data )
    if( res.success ) setInvoices( res.data )
      

  }

  const get_workers                = async (token ) => {

    const res = await post("get_workers", { token })
    console.log("get_workers App...", res.data )
    if( res.success ) setWorkers( res.data )

  }

  return {
    auth
  };
};
