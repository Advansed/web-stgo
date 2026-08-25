import { useEffect } from 'react';
import { useAuth, useToken } from './Store/loginStore';
import { useInvoicesStore } from './Store/invoiceStore';
import { useNavigationStore } from './Store/navigationStore';
import { getWorkers } from './Store/api';

export const useApp = () => {
  const { auth } = useAuth();
  const { token } = useToken();

  useEffect(() => {
    if (auth && token) {
      useInvoicesStore.getState().loadInvoices(token);
      get_workers(token);
    }
  }, [auth, token]);

  const get_workers = async (t: string) => {
    const res = await getWorkers(t);
    if (res.success) useNavigationStore.getState().setWorkers(res.data);
  };

  return { auth };
};
