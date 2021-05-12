/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { kea, MakeLogicType } from 'kea';

import { clearFlashMessages, flashAPIErrors } from '../../../shared/flash_messages';
import { HttpLogic } from '../../../shared/http';

interface OAuthPreAuthServerProps {
  client_id: string;
  client_name: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
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
  initializeOAuthPreAuth(queryParams: string): void;
  allowOAuthAuthorization(): void;
  denyOAuthAuthorization(): void;
  setButtonNotLoading(): void;
}

const route = '/api/workplace_search/oauth/authorize';

export const OAuthAuthorizeLogic = kea<MakeLogicType<OAuthAuthorizeValues, OAuthAuthorizeActions>>({
  path: ['enterprise_search', 'workplace_search', 'oauth_authorize_logic'],
  actions: {
    setServerProps: (serverProps: OAuthPreAuthServerProps) => serverProps,
    initializeOAuthPreAuth: (queryParams: string) => null,
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
  listeners: ({ actions }) => ({
    initializeOAuthPreAuth: async (queryParams: string) => {
      clearFlashMessages();
      const { http } = HttpLogic.values;

      try {
        const response = await http.get(route, { query: queryParams });
        actions.setServerProps(response);
      } catch (e) {
        flashAPIErrors(e);
      }
    },
    denyOAuthAuthorization: async () => {
      const { http } = HttpLogic.values;

      try {
        const response = await http.get(route);
        window.location.replace(response.redirect_uri);
      } catch (e) {
        flashAPIErrors(e);
        actions.setButtonNotLoading();
      }
    },
    allowOAuthAuthorization: async () => {
      const { http } = HttpLogic.values;

      try {
        const response = await http.get(route);
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

