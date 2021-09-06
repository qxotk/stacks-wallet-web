import React, { useCallback, useEffect } from 'react';

import { Route as RouterRoute, Routes as RoutesDom, useLocation } from 'react-router-dom';

import { MagicRecoveryCode } from '@pages/install/magic-recovery-code';
import { Username } from '@pages/username';
import { ChooseAccount } from '@pages/choose-account/choose-account';
import { TransactionPage } from '@pages/transaction-signing/transaction-signing';
import { Installed } from '@pages/install';
import { InstalledSignIn } from '@pages/install/sign-in';

import { PopupReceive } from '@pages/receive-tokens/receive-tokens';
import { AddNetwork } from '@pages/add-network/add-network';
import { SetPasswordPage } from '@pages/set-password';
import { SendTokensForm } from '@pages/send-tokens/send-tokens';

import { SaveYourKeyView } from '@pages/save-your-secret-key/save-your-key-view';
import { ScreenPaths } from '@common/types';
import { useChangeScreen } from '@common/hooks/use-change-screen';
import { useWallet } from '@common/hooks/use-wallet';
import { useOnboardingState } from '@common/hooks/auth/use-onboarding-state';
import { useSaveAuthRequest } from '@common/hooks/auth/use-save-auth-request-callback';
import { Navigate } from '@components/navigate';
import { AccountGate } from '@pages/account-gate';
import { AccountGateRoute } from '@pages/account-gate-route';
import { Unlock } from '@components/unlock';
import { PopupHome } from '@pages/home/home';
import { useUpdateLastSeenStore } from '@store/wallet/wallet.hooks';
import { SignOutConfirmPage } from '@pages/sign-out-confirm/sign-out-confirm';

interface RouteProps {
  path: ScreenPaths;
  element: React.ReactNode;
}

export const Route: React.FC<RouteProps> = ({ path, element }) => {
  return <RouterRoute path={path} element={<>{element}</>} />;
};

export const Routes: React.FC = () => {
  const { isSignedIn: signedIn, encryptedSecretKey } = useWallet();
  const { isOnboardingInProgress } = useOnboardingState();
  const { search, pathname } = useLocation();
  const setLastSeen = useUpdateLastSeenStore();

  const doChangeScreen = useChangeScreen();
  useSaveAuthRequest();

  const isSignedIn = signedIn && !isOnboardingInProgress;
  const isLocked = !signedIn && encryptedSecretKey;

  // Keep track of 'last seen' by updating it whenever a route is set.
  useEffect(() => {
    setLastSeen(new Date().getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const getHomeComponent = useCallback(() => {
    if (isSignedIn || encryptedSecretKey) {
      return (
        <AccountGate>
          <PopupHome />
        </AccountGate>
      );
    }
    return <Installed />;
  }, [isSignedIn, encryptedSecretKey]);

  const getSignInComponent = () => {
    if (isLocked) return <Unlock />;
    if (isSignedIn)
      return <Navigate to={ScreenPaths.CHOOSE_ACCOUNT} screenPath={ScreenPaths.CHOOSE_ACCOUNT} />;
    return <InstalledSignIn />;
  };

  const getSignUpElement = () => {
    if (isLocked) return <Unlock />;
    if (isSignedIn) {
      return (
        <Navigate
          to={`${ScreenPaths.CHOOSE_ACCOUNT}${search}`}
          screenPath={ScreenPaths.CHOOSE_ACCOUNT}
        />
      );
    }
    return <Installed />;
  };

  return (
    <RoutesDom>
      <Route path={ScreenPaths.HOME} element={getHomeComponent()} />
      {/* Installation */}
      <Route path={ScreenPaths.SIGN_IN_INSTALLED} element={<InstalledSignIn />} />
      <AccountGateRoute path={ScreenPaths.POPUP_HOME}>
        <PopupHome />
      </AccountGateRoute>
      <AccountGateRoute path={ScreenPaths.POPUP_SEND}>
        <React.Suspense fallback={<></>}>
          <SendTokensForm />
        </React.Suspense>
      </AccountGateRoute>
      <AccountGateRoute path={ScreenPaths.POPUP_RECEIVE}>
        <PopupReceive />
      </AccountGateRoute>
      <AccountGateRoute path={ScreenPaths.SETTINGS_KEY}>
        <SaveYourKeyView onClose={() => doChangeScreen(ScreenPaths.HOME)} title="Your Secret Key" />
      </AccountGateRoute>
      <RouterRoute path={ScreenPaths.ADD_NETWORK} element={<AddNetwork />} />
      <Route path={ScreenPaths.SET_PASSWORD} element={<SetPasswordPage redirect />} />
      <Route path={ScreenPaths.SIGN_OUT_CONFIRM} element={<SignOutConfirmPage />} />
      <Route path={ScreenPaths.USERNAME} element={<Username />} />
      <Route path={ScreenPaths.GENERATION} element={getSignUpElement()} />
      {/*Sign In*/}
      <Route path={ScreenPaths.SIGN_IN} element={getSignInComponent()} />
      <Route path={ScreenPaths.RECOVERY_CODE} element={<MagicRecoveryCode />} />
      <Route path={ScreenPaths.ADD_ACCOUNT} element={<Username />} />;
      <Route
        path={ScreenPaths.CHOOSE_ACCOUNT}
        element={
          <React.Suspense fallback={<></>}>
            <ChooseAccount />
          </React.Suspense>
        }
      />
      {/* Transactions */}
      <AccountGateRoute path={ScreenPaths.TRANSACTION_POPUP}>
        <TransactionPage />
      </AccountGateRoute>
    </RoutesDom>
  );
};
