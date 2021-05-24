/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { kea, MakeLogicType } from 'kea';

import { JSON_HEADER as headers } from '../../../../../common/constants';
import { clearFlashMessages, flashAPIErrors } from '../../../shared/flash_messages';
import { HttpLogic } from '../../../shared/http';
import { parseQueryParams } from '../../../shared/query_params';

interface OAuthPreAuthServerProps {
  client_id: string;
  client_name: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
  status: string;
}

interface OAuthAuthorizeParams {
  client_id: string;
  code_challenge?: string;
  code_challenge_method?: string;
  response_type: string;
  response_mode?: string;
  redirect_uri?: string;
  scope?: string;
  state?: string;
}

interface OAuthPreAuthorization {
  clientId: string;
  clientName: string;
  redirectUri: string;
  responseType: string;
  rawScopes: string;
  scopes: string[];
  state: string;
}

interface OAuthAuthorizeValues {
  dataLoading: boolean;
  buttonLoading: boolean;
  cachedPreAuth: OAuthPreAuthorization;
}

interface OAuthAuthorizeActions {
  setServerProps(serverProps: OAuthPreAuthServerProps): OAuthPreAuthServerProps;
  initializeOAuthPreAuth(queryString: string): string;
  allowOAuthAuthorization(): void;
  denyOAuthAuthorization(): void;
  setButtonNotLoading(): void;
}

const route = '/api/workplace_search/oauth/authorize';

export const OAuthAuthorizeLogic = kea<MakeLogicType<OAuthAuthorizeValues, OAuthAuthorizeActions>>({
  path: ['enterprise_search', 'workplace_search', 'oauth_authorize_logic'],
  actions: {
    setServerProps: (serverProps: OAuthPreAuthServerProps) => serverProps,
    initializeOAuthPreAuth: (queryString: string) => queryString,
    allowOAuthAuthorization: () => null,
    denyOAuthAuthorization: () => null,
    setButtonNotLoading: () => null,
  },
  reducers: {
    dataLoading: [
      true,
      {
        setServerProps: () => false,
      },
    ],
    cachedPreAuth: [
      {} as OAuthPreAuthorization,
      {
        setServerProps: (_, serverProps) => transformServerPreAuth(serverProps),
      },
    ],
    buttonLoading: [
      false,
      {
        setButtonNotLoading: () => false,
        allowOAuthAuthorization: () => true,
        denyOAuthAuthorization: () => true,
      },
    ],
  },
  listeners: ({ actions, values }) => ({
    initializeOAuthPreAuth: async (queryString: string) => {
      clearFlashMessages();
      const { http } = HttpLogic.values;
      const query = (parseQueryParams(queryString) as unknown) as OAuthAuthorizeParams;

      try {
        const response = await http.get(route, { query });

        if (response.status === 'redirect') {
          window.location.replace(response.redirect_uri);
        } else {
          actions.setServerProps(response);
        }
      } catch (e) {
        flashAPIErrors(e);
      }
    },
    denyOAuthAuthorization: async () => {
      const { http } = HttpLogic.values;
      const { cachedPreAuth } = values;

      try {
        const response = await http.delete(route, {
          body: JSON.stringify({
            client_id: cachedPreAuth.clientId,
            response_type: cachedPreAuth.responseType,
            redirect_uri: cachedPreAuth.redirectUri,
            scope: cachedPreAuth.rawScopes,
            state: cachedPreAuth.state,
          }),
          headers,
        });

        window.location.replace(response.redirect_uri);
      } catch (e) {
        flashAPIErrors(e);
        actions.setButtonNotLoading();
      }
    },
    allowOAuthAuthorization: async () => {
      const { http } = HttpLogic.values;
      const { cachedPreAuth } = values;

      try {
        const response = await http.post(route, {
          body: JSON.stringify({
            client_id: cachedPreAuth.clientId,
            response_type: cachedPreAuth.responseType,
            redirect_uri: cachedPreAuth.redirectUri,
            scope: cachedPreAuth.rawScopes,
            state: cachedPreAuth.state,
          }),
          headers,
        });

        window.location.replace(response.redirect_uri);
      } catch (e) {
        flashAPIErrors(e);
        actions.setButtonNotLoading();
      }
    },
  }),
});

const transformServerPreAuth = (serverProps: OAuthPreAuthServerProps): OAuthPreAuthorization => {
  return {
    clientId: serverProps.client_id,
    clientName: serverProps.client_name,
    redirectUri: serverProps.redirect_uri,
    responseType: serverProps.response_type,
    rawScopes: serverProps.scope,
    scopes: serverProps.scope.split(', '),
    state: serverProps.state,
  };
};

