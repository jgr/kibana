/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { KibanaRequest } from 'src/core/server';

import type { SecurityPluginStart } from '../../../security/server';

class UserDataStorage {
  private storage;
  private security;

  setUserDataStorage(initializedStorage, securityPlugin: SecurityPluginStart) {
    this.storage = initializedStorage;
    this.security = securityPlugin;
  }

  get(request: KibanaRequest, key: string): string | undefined {
    if (this.sessionStorageAvailable(request)) {
      return this.storage.get(request, key);
    }
  }

  set(request: KibanaRequest, key: string, value: string): void {
    if (this.sessionStorageAvailable(request)) {
      this.storage.set(request, key, value);
    }
  }

  remove(request: KibanaRequest, key: string): void {
    if (this.sessionStorageAvailable(request)) {
      this.storage.remove(request, key);
    }
  }

  sessionStorageAvailable(request: KibanaRequest) {
    return this.security && this.storage && this.security.session.hasActiveSession(request);
  }
}

export const userDataStorage = new UserDataStorage();

