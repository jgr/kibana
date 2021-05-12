/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect } from 'react';

import { useActions, useValues } from 'kea';

import {
  EuiButton,
  EuiCallOut,
  EuiPage,
  EuiPageBody,
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiText,
  EuiSpacer,
} from '@elastic/eui';

import { FlashMessages } from '../../../shared/flash_messages';
import { Loading } from '../../../shared/loading';

import { OAuthAuthorizeLogic } from './oauth_authorize_logic';

export const OAuthAuthorize: React.FC = () => {
  const { initializeOAuthPreAuth, allowOAuthAuthorization, denyOAuthAuthorization } = useActions(
    OAuthAuthorizeLogic
  );

  const { buttonLoading, dataLoading, cachedPreAuth } = useValues(OAuthAuthorizeLogic);

  useEffect(() => {
    initializeOAuthPreAuth();
  }, []);

  if (dataLoading) return <Loading />;

  const showHttpRedirectUriWarning = false;

  const httpRedirectUriWarning = (
    <>
      <EuiCallOut
        title="This application is using an insecure redirect URI (http)"
        color="danger"
        iconType="cross"
      />
      <EuiSpacer />
    </>
  );

  return (
    <EuiPage restrictWidth>
      <EuiPageBody>
        <FlashMessages />
        <EuiSpacer />
        <EuiPanel paddingSize="l" style={{ maxWidth: 500, margin: '40px auto' }}>
          <EuiTitle>
            <h1>Workplace Search</h1>
          </EuiTitle>
          <EuiTitle>
            <h2>Authorization required</h2>
          </EuiTitle>
          <EuiSpacer />
          <EuiText>
            <p>
              Authorize <strong>{cachedPreAuth.clientName}</strong> to use your account?
            </p>
          </EuiText>
          <EuiSpacer />
          {httpRedirectUriWarning}
          <EuiCallOut title="This application will be able to" iconType="iInCircle">
            <ul>
              <li>Search your data</li>
            </ul>
          </EuiCallOut>

          <EuiSpacer />

          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiButton color="danger" onClick={denyOAuthAuthorization} disabled={buttonLoading}>
                Deny
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiButton
                color="primary"
                fill
                onClick={allowOAuthAuthorization}
                disabled={buttonLoading}
              >
                Authorize
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiPageBody>
    </EuiPage>
  );
};

