import { IonApp, IonRouterOutlet, IonSplitPane, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
import Page from './pages/Page';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import './theme/variables.css';
import Login from './components/Login/Login';
import { ToastProvider } from './components/Toast';
import { useApp } from './useApp';

setupIonicReact();

const AppContent: React.FC = () => {
  const { auth } = useApp();

  if (!auth) return <Login />;

  return (
    <IonReactRouter>
      <IonSplitPane contentId="main">
        <IonRouterOutlet id="main">
          <Route path="/" exact={true}>
            <Redirect to="/home" />
          </Route>

          <Route path="/:name" exact={true}>
            <Page />
          </Route>
        </IonRouterOutlet>
      </IonSplitPane>
    </IonReactRouter>
  );
};

const App: React.FC = () => {
  return (
    <IonApp>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </IonApp>
  );
};

export default App;
