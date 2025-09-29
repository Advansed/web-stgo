
const url = 'http://83.169.226.134/node/'

export interface TResponse {
  success:          boolean;
  data:             any;
  message:         string;
}

export const EMPTY_USER: TResponse = {
    success:        false,
    data:           {},
    message:       "Ошибка в клиенте"
}

async function post(method: string, params:any) {
    try {
        const response = await fetch( url + method, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify( params )
        });
                
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка:', error);
        return { success: false, message: 'Ошибка сети' };
    }
}

export const login = async (login: string, password: string) : Promise<TResponse> => {
    return await post("login", {login, password}) || EMPTY_USER
}