import { useState } from "react"

export function useNavigation() {
    const [ navigation, setNavigation ] = useState({
        position:       0,
        canGoBack:      true,
    })
    
    const navigateToPosition = ( position: any) => {
         setNavigation(prev => ({
            position:   position.position,
            canGoBack:  position.position > 0
        }));
    }


    const goBack = () =>{
        setNavigation(prev => {
            const newPosition = Math.max(0, prev.position - 1);
            return {
                ...prev,
                position: newPosition,
                canGoBack: newPosition > 0
            };
        });   
    }

    return {    
          navigation
        , setNavigation
        , goBack
        , navigateToPosition
    }
}