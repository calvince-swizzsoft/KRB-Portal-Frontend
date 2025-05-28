import React from 'react';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';

import Layout from './assets/pages/Layout.jsx';
import UserAuth from './assets/pages/userauth.jsx';
import OTPVerification from './assets/pages/OTPVerification.jsx';

// the compontents /mini pages
import MemberProfile from './assets/components/MemberProfile.jsx';
import MemberAccounts from './assets/components/MemberAccounts.jsx';
import GuarantorRequest from './assets/components/Gurantorship.jsx';
import LoanBalances from './assets/components/LoanBalances.jsx';
import OnlineLoanApplication from './assets/components/OnlineLoanApplication.jsx';
import DetailedStatement from './assets/components/DetailedStatement.jsx';
import LoanBalanceStatement from './assets/components/LoanBalanceStatement.jsx';
import DepositStatement from './assets/components/DepositStatements.jsx';
import GuarantorStatement from './assets/components/GurantorStatement.jsx';
import GuaranteedStatement from './assets/components/GuranteedStatement.jsx';
import Dashboard from './assets/components/Dashboard.jsx'
import Help from './assets/components/Help.jsx';
import AppliedLoans from './assets/components/AppliedLoans.jsx';
import LoanDetailsModal from './assets/components/LoanDetailsModal.jsx'
import EditProfile from './assets/components/EditProfile.jsx';
import ShareCertificateStatement from './assets/components/ShareCertificateStatement.jsx';
import ChangePassword from './assets/components/ChangePassword.jsx';

const router = createBrowserRouter([
  {path: "/", element: <UserAuth/>},
  {path: '/OTPVerification', element: <OTPVerification/> },
  
  {
    path: '/Home',
    element: <Layout />,
    children: [
      {path: 'Dashboard',element: <Dashboard/>},
      { path: 'member-profile', element: <MemberProfile/>},
      { path: 'member-accounts', element: <MemberAccounts /> },
      { path: 'guarantor-request', element: <GuarantorRequest /> },
      { path: 'loan-balances', element: <LoanBalances /> },
      { path: 'loan-application', element: <OnlineLoanApplication/> },
      { path: 'AppliedLoans', element: <AppliedLoans/>},
      { path: 'detailed-statement', element: <DetailedStatement /> },
      { path: 'loan-balance-statement', element: <LoanBalanceStatement /> },
      { path: 'deposit-statement', element: <DepositStatement /> },
      { path: 'guarantor-statement', element: <GuarantorStatement /> },
      { path: 'guaranteed-statement', element: <GuaranteedStatement /> },
      { path: 'share-certificate',element: <ShareCertificateStatement/>},
      { path: 'EditProfile',element: <EditProfile/>},
      { path: 'change-password', element: <ChangePassword/> },
    ],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
