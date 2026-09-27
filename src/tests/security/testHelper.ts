import http from 'http';
import { AddressInfo } from 'net';
import { createExpressApp } from '../../server/app';
import { prisma } from '../../server/db/prisma';

export interface TestServerContext {
  server: http.Server;
  baseUrl: string;
  close: () => Promise<void>;
  request: (
    endpoint: string,
    options?: RequestInit,
    token?: string
  ) => Promise<{ status: number; data: any; headers: Headers }>;
}

export async function startTestServer(): Promise<TestServerContext> {
  const app = createExpressApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  const request = async (
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Connection: 'close',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    let data: any = null;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return {
      status: res.status,
      data,
      headers: res.headers,
    };
  };

  const close = async () => {
    if (typeof (server as any).closeAllConnections === 'function') {
      (server as any).closeAllConnections();
    }
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  };

  return {
    server,
    baseUrl,
    close,
    request,
  };
}
