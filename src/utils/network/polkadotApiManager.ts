import { typesBundleForPolkadotApps } from '@darwinia/types/mix';
import { ApiPromise, WsProvider } from '@polkadot/api';

interface ApiGuy {
  [key: string]: ApiPromise;
}

class ApiManager {
  private apiList: ApiGuy[] = [];

  getInstance(url: string): ApiPromise {
    const exist = this.checkExist(url);

    if (exist) {
      return exist[url];
    }

    const provider = new WsProvider(url, false); // false: disable polkadot api auto reconnect;
    const instance = new ApiPromise({
      provider,
      typesBundle: typesBundleForPolkadotApps,
    });

    this.apiList.push({ [url]: instance });
    instance.connect();

    return instance;
  }

  removeInstance(url: string): void {
    const exist = this.checkExist(url);

    if (exist) {
      exist[url].disconnect();
      this.apiList = this.apiList.filter((item) => item === exist);
    }
  }

  private checkExist(url: string): ApiGuy | null {
    const target = this.apiList.find((item) => item[url]);

    return target ?? null;
  }
}

/**
 * Hold a singleton manager in apps scope.
 * The manager guarantees that the polkadot ApiPromise instance will not be instantiated repeatedly.
 */
export const polkadotApiManager = (() => {
  let instance: ApiManager;

  return {
    get manager() {
      if (instance) {
        return instance;
      }

      instance = new ApiManager();

      return instance;
    },
  };
})();
