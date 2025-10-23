import { describe, it, expect } from 'vitest';
import {
  truthy,
  cloneHeaders,
  replaceUrl1,
  replaceUrl2,
  processLinkHeader,
  replaceCasXetReconstructionResponse
} from '../src/index';
import type { CasXetReconstructionResponse } from '@/types/hf';

describe('Helper functions', () => {
  describe('truthy', () => {
    for (const val of ['true', '1', 'yes', 'TRUE', 'on', '1 ']) {
      it('should return true for ' + val, () => {
        expect(truthy(val)).toBe(true);
      });
    }
    for (const val of ['false', '0', 'no', 'FALSE', 'off', '0 ', '', ' ', undefined]) {
      it('should return false for ' + val, () => {
        expect(truthy(val)).toBe(false);
      });
    }
  });

  it('cloneHeaders should clone all headers correctly', () => {
    const original = new Headers();
    original.set('Content-Type', 'application/json');
    original.set('X-Custom-Header', 'test-value');

    const cloned = cloneHeaders(original);

    expect(cloned.get('Content-Type')).toBe('application/json');
    expect(cloned.get('X-Custom-Header')).toBe('test-value');
    expect([...cloned.keys()].length).toBe(2);
  });

  it('replaceUrl1 should replace the hostname in a URL', () => {
    const originalUrl = 'https://huggingface.co/path/to/resource';
    const newHostname = 'example.com';

    const result = replaceUrl1(originalUrl, newHostname);

    expect(result.hostname).toBe(newHostname);
    expect(result.pathname).toBe('/path/to/resource');
    expect(result.protocol).toBe('https:');
  });

  it('replaceUrl2 should create a proxy URL with the original URL as a parameter', () => {
    const originalUrl = 'https://cdn-lfs.huggingface.co/path/to/model';
    const hostname = 'example.com';

    const result = replaceUrl2(originalUrl, hostname);

    expect(result).toBe(`https://hf-proxy.example.com/?location=${encodeURIComponent(originalUrl)}`);
  });

  it('processLinkHeader should transform URLs in Link header', () => {
    const linkHeader = '<https://huggingface.co/path/to>; rel="next", <https://cdn-lfs.hf.co/file>; rel="file"';
    const hostname = 'example.com';

    const result = processLinkHeader(linkHeader, hostname);

    // expect(result).toContain('example.com');
    // expect(result).toContain(`hf-proxy.${hostname}`);
    // expect(result).not.toContain('huggingface.co');
    expect(result).toBe(
      '<https://example.com/path/to>; rel="next", ' +
      '<https://hf-proxy.example.com/?location=https%3A%2F%2Fcdn-lfs.hf.co%2Ffile>; rel="file"'
    );
  });

  it('replaceCasXetReconstructionResponse should replace URLs in CasXetReconstructionResponse', () => {
    const response: CasXetReconstructionResponse = {
      "offset_into_first_range": 0,
      "terms": [
        {
          "hash": "0387cb983a89cc051812911ce0cdd475e4f00326fdd390c9da1f326d84972feb",
          "unpacked_length": 39501,
          "range": {
            "start": 0,
            "end": 1
          }
        },
        {
          "hash": "db0e08957b9cf3fadc6b404013320ddba0ee01ed6231461a62ddfedb23dbe59e",
          "unpacked_length": 66786202,
          "range": {
            "start": 4,
            "end": 1097
          }
        },
        {
          "hash": "0387cb983a89cc051812911ce0cdd475e4f00326fdd390c9da1f326d84972feb",
          "unpacked_length": 11946,
          "range": {
            "start": 71,
            "end": 72
          }
        }
      ],
      "fetch_info": {
        "ba9dca3f424b7acb9bcc6388f0761e304675e5dbddd643e52f4d05b65e8fcd89": [
          {
            "range": {
              "start": 0,
              "end": 301
            },
            "url": "https://transfer.xethub.hf.co/xorbs/default/ba9dca3f424b7acb9bcc6388f0761e304675e5dbddd643e52f4d05b65e8fcd89?X-Xet-Signed-Range=bytes%3D0-16082043&X-Xet-Session-Id=unknown&Expires=1761015440&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly90cmFuc2Zlci54ZXRodWIuaGYuY28veG9yYnMvZGVmYXVsdC9iYTlkY2EzZjQyNGI3YWNiOWJjYzYzODhmMDc2MWUzMDQ2NzVlNWRiZGRkNjQzZTUyZjRkMDViNjVlOGZjZDg5P1gtWGV0LVNpZ25lZC1SYW5nZT1ieXRlcyUzRDAtMTYwODIwNDMmWC1YZXQtU2Vzc2lvbi1JZD11bmtub3duIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzYxMDE1NDQwfX19XX0_&Signature=BgQhYFylyfR1JF6zCrIMDNeELw5ZSOYIdcUVmq5FGhEs5oKm4~-0Cf5Y~zcO1Nc4ZDZjemHpIz6iY~fuQvz6CLaM~-0CTPam8jqFl81rEK5wRcamdhM7k9UeFEr0Eq9dYE1xk-bsFNiW7jsxHydO6VL0VwGxHaf3-ok5sn6JsM14eUfzg6mc9qn-K48oKGVqvkFdlnauUy7Ph1NnTQG8elq4uIejhL~0FY3pQGyoDQldeSVD~Nwf0luaRYmUg2VtgZW5XprzO7IqYMvqy7Hwh-5AGOM4od8YBgj2HO91RlPzSs1UD3-1jOIDGth0pZ5ViVr2Vp0TvieKYtdVcMDOeg__&Key-Pair-Id=K2L8F4GPSG1IFC",
            "url_range": {
              "start": 0,
              "end": 16082043
            }
          },
          {
            "range": {
              "start": 303,
              "end": 740
            },
            "url": "https://transfer.xethub.hf.co/xorbs/default/ba9dca3f424b7acb9bcc6388f0761e304675e5dbddd643e52f4d05b65e8fcd89?X-Xet-Signed-Range=bytes%3D16273596-38924683&X-Xet-Session-Id=unknown&Expires=1761015440&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly90cmFuc2Zlci54ZXRodWIuaGYuY28veG9yYnMvZGVmYXVsdC9iYTlkY2EzZjQyNGI3YWNiOWJjYzYzODhmMDc2MWUzMDQ2NzVlNWRiZGRkNjQzZTUyZjRkMDViNjVlOGZjZDg5P1gtWGV0LVNpZ25lZC1SYW5nZT1ieXRlcyUzRDE2MjczNTk2LTM4OTI0NjgzJlgtWGV0LVNlc3Npb24tSWQ9dW5rbm93biIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc2MTAxNTQ0MH19fV19&Signature=BjfTwDOLBeW2m87WiVXklwNPPDoxJiDn-tfSDblhLtFaLzbUjg8s9BWMh9RB7~zPS38lBjAGs0PWfYz7TF-5CC3RN0xC4xvLleocix2h8OF5czfPCtOLIwDWYKrRsTApfkQbfQITD-8kYcvSZfM9x9rmWClhtprDfMMbILDb-ATtErufurI-VP8tGYPGNasOotI5YJ84-B8CJIK~rIm79E~AaeaiWIxpsh4MCX5mMae~mc-tAf3rUFKHmvMxSbEVibR7NMZH~84~DCdPL9N8VEWAQGlCPHsHsQN7zkYDjOFXhmY6DBehhOOM6DeiuRENZti7dBXc-c7p--yDHm8LKQ__&Key-Pair-Id=K2L8F4GPSG1IFC",
            "url_range": {
              "start": 16273596,
              "end": 38924683
            }
          },
          {
            "range": {
              "start": 742,
              "end": 1079
            },
            "url": "https://transfer.xethub.hf.co/xorbs/default/ba9dca3f424b7acb9bcc6388f0761e304675e5dbddd643e52f4d05b65e8fcd89?X-Xet-Signed-Range=bytes%3D39110906-58334217&X-Xet-Session-Id=unknown&Expires=1761015440&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly90cmFuc2Zlci54ZXRodWIuaGYuY28veG9yYnMvZGVmYXVsdC9iYTlkY2EzZjQyNGI3YWNiOWJjYzYzODhmMDc2MWUzMDQ2NzVlNWRiZGRkNjQzZTUyZjRkMDViNjVlOGZjZDg5P1gtWGV0LVNpZ25lZC1SYW5nZT1ieXRlcyUzRDM5MTEwOTA2LTU4MzM0MjE3JlgtWGV0LVNlc3Npb24tSWQ9dW5rbm93biIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc2MTAxNTQ0MH19fV19&Signature=P20fV2sZz8kVF4dXA6T4KBafKprkni2IxR1FdtvTZZeslmdqVuW2vwbIhbdKcflMw9HBAb-vkKdSowMq8JAR4Tl~lmfkpz4AgyRc-tV7z4xpKuaQw9wx5hYD2hBLp1kTz~aSNCD59BCnjaMM~eZFoLegYgXS42ILqwsvkGRTB7J-EvEaqdgXtBqNSUwhyuPeOqRt19qYYpoUaDQBK7Vw0L2nQZu05QfS1cxP6vJj3TTCodZaSSWYdCcP-fckCNDCsNYyZqbxN1bTkNqAClaHSoj~EHQa43o1iLSW23shRjSVZS2Qw-RUxL1zNryMHUnAdBFxD2bHB3fJp3dfEd16jA__&Key-Pair-Id=K2L8F4GPSG1IFC",
            "url_range": {
              "start": 39110906,
              "end": 58334217
            }
          }
        ],
        "3d0e209360ce0234973a761ae8d155722a865eb6ffb440aefa483e37f5a9bec3": [
          {
            "range": {
              "start": 0,
              "end": 1042
            },
            "url": "https://transfer.xethub.hf.co/xorbs/default/3d0e209360ce0234973a761ae8d155722a865eb6ffb440aefa483e37f5a9bec3?X-Xet-Signed-Range=bytes%3D0-58369192&X-Xet-Session-Id=unknown&Expires=1761015439&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly90cmFuc2Zlci54ZXRodWIuaGYuY28veG9yYnMvZGVmYXVsdC8zZDBlMjA5MzYwY2UwMjM0OTczYTc2MWFlOGQxNTU3MjJhODY1ZWI2ZmZiNDQwYWVmYTQ4M2UzN2Y1YTliZWMzP1gtWGV0LVNpZ25lZC1SYW5nZT1ieXRlcyUzRDAtNTgzNjkxOTImWC1YZXQtU2Vzc2lvbi1JZD11bmtub3duIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzYxMDE1NDM5fX19XX0_&Signature=Ekjvd03gdBTPRk3lcuwdR57I-kXL6UM2z1F4JsVo0ld1M5v8jfqNzXIYx4fiavWZU6ViE1gcwf-bgMhm~zWegAnM6B1~Wgy43s2Hd6mwB6Hy~26p6qItU6z73XgkRaxYxOyWsJgRJ80ff-~H6WPK6E9wkUrthlHCo-U0C0bT1g~OqeYqZvn7In1s2eUZ8MqkyufRkuzu3ZyNpbdhYZwi2MdwB45cpRjH8dyiIcEXUH60c0yX2yz8MiQs5h4CF7OKDeRHx7jTYL3JNwruUAxwnJuDRV4N0puqwbeothAdmpKc7znhHqZyFxWCUmBm9V~CMSavFLF5XMb0ha0F-BWziQ__&Key-Pair-Id=K2L8F4GPSG1IFC",
            "url_range": {
              "start": 0,
              "end": 58369192
            }
          }
        ]
      }
    };

    const expectedResponse: CasXetReconstructionResponse = {
      "offset_into_first_range": 0,
      "terms": [
        {
          "hash": "0387cb983a89cc051812911ce0cdd475e4f00326fdd390c9da1f326d84972feb",
          "unpacked_length": 39501,
          "range": {
            "start": 0,
            "end": 1
          }
        },
        {
          "hash": "db0e08957b9cf3fadc6b404013320ddba0ee01ed6231461a62ddfedb23dbe59e",
          "unpacked_length": 66786202,
          "range": {
            "start": 4,
            "end": 1097
          }
        },
        {
          "hash": "0387cb983a89cc051812911ce0cdd475e4f00326fdd390c9da1f326d84972feb",
          "unpacked_length": 11946,
          "range": {
            "start": 71,
            "end": 72
          }
        }
      ],
      "fetch_info": {
        "ba9dca3f424b7acb9bcc6388f0761e304675e5dbddd643e52f4d05b65e8fcd89": [
          {
            "range": {
              "start": 0,
              "end": 301
            },
            "url": "https://hf-proxy.example.com/?location=https%3A%2F%2Ftransfer.xethub.hf.co%2Fxorbs%2Fdefault%2Fba9dca3f424b7acb9bcc6388f0761e304675e5dbddd643e52f4d05b65e8fcd89%3FX-Xet-Signed-Range%3Dbytes%253D0-16082043%26X-Xet-Session-Id%3Dunknown%26Expires%3D1761015440%26Policy%3DeyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly90cmFuc2Zlci54ZXRodWIuaGYuY28veG9yYnMvZGVmYXVsdC9iYTlkY2EzZjQyNGI3YWNiOWJjYzYzODhmMDc2MWUzMDQ2NzVlNWRiZGRkNjQzZTUyZjRkMDViNjVlOGZjZDg5P1gtWGV0LVNpZ25lZC1SYW5nZT1ieXRlcyUzRDAtMTYwODIwNDMmWC1YZXQtU2Vzc2lvbi1JZD11bmtub3duIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzYxMDE1NDQwfX19XX0_%26Signature%3DBgQhYFylyfR1JF6zCrIMDNeELw5ZSOYIdcUVmq5FGhEs5oKm4~-0Cf5Y~zcO1Nc4ZDZjemHpIz6iY~fuQvz6CLaM~-0CTPam8jqFl81rEK5wRcamdhM7k9UeFEr0Eq9dYE1xk-bsFNiW7jsxHydO6VL0VwGxHaf3-ok5sn6JsM14eUfzg6mc9qn-K48oKGVqvkFdlnauUy7Ph1NnTQG8elq4uIejhL~0FY3pQGyoDQldeSVD~Nwf0luaRYmUg2VtgZW5XprzO7IqYMvqy7Hwh-5AGOM4od8YBgj2HO91RlPzSs1UD3-1jOIDGth0pZ5ViVr2Vp0TvieKYtdVcMDOeg__%26Key-Pair-Id%3DK2L8F4GPSG1IFC",
            "url_range": {
              "start": 0,
              "end": 16082043
            }
          },
          {
            "range": {
              "start": 303,
              "end": 740
            },
            "url": "https://hf-proxy.example.com/?location=https%3A%2F%2Ftransfer.xethub.hf.co%2Fxorbs%2Fdefault%2Fba9dca3f424b7acb9bcc6388f0761e304675e5dbddd643e52f4d05b65e8fcd89%3FX-Xet-Signed-Range%3Dbytes%253D16273596-38924683%26X-Xet-Session-Id%3Dunknown%26Expires%3D1761015440%26Policy%3DeyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly90cmFuc2Zlci54ZXRodWIuaGYuY28veG9yYnMvZGVmYXVsdC9iYTlkY2EzZjQyNGI3YWNiOWJjYzYzODhmMDc2MWUzMDQ2NzVlNWRiZGRkNjQzZTUyZjRkMDViNjVlOGZjZDg5P1gtWGV0LVNpZ25lZC1SYW5nZT1ieXRlcyUzRDE2MjczNTk2LTM4OTI0NjgzJlgtWGV0LVNlc3Npb24tSWQ9dW5rbm93biIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc2MTAxNTQ0MH19fV19%26Signature%3DBjfTwDOLBeW2m87WiVXklwNPPDoxJiDn-tfSDblhLtFaLzbUjg8s9BWMh9RB7~zPS38lBjAGs0PWfYz7TF-5CC3RN0xC4xvLleocix2h8OF5czfPCtOLIwDWYKrRsTApfkQbfQITD-8kYcvSZfM9x9rmWClhtprDfMMbILDb-ATtErufurI-VP8tGYPGNasOotI5YJ84-B8CJIK~rIm79E~AaeaiWIxpsh4MCX5mMae~mc-tAf3rUFKHmvMxSbEVibR7NMZH~84~DCdPL9N8VEWAQGlCPHsHsQN7zkYDjOFXhmY6DBehhOOM6DeiuRENZti7dBXc-c7p--yDHm8LKQ__%26Key-Pair-Id%3DK2L8F4GPSG1IFC",
            "url_range": {
              "start": 16273596,
              "end": 38924683
            }
          },
          {
            "range": {
              "start": 742,
              "end": 1079
            },
            "url": "https://hf-proxy.example.com/?location=https%3A%2F%2Ftransfer.xethub.hf.co%2Fxorbs%2Fdefault%2Fba9dca3f424b7acb9bcc6388f0761e304675e5dbddd643e52f4d05b65e8fcd89%3FX-Xet-Signed-Range%3Dbytes%253D39110906-58334217%26X-Xet-Session-Id%3Dunknown%26Expires%3D1761015440%26Policy%3DeyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly90cmFuc2Zlci54ZXRodWIuaGYuY28veG9yYnMvZGVmYXVsdC9iYTlkY2EzZjQyNGI3YWNiOWJjYzYzODhmMDc2MWUzMDQ2NzVlNWRiZGRkNjQzZTUyZjRkMDViNjVlOGZjZDg5P1gtWGV0LVNpZ25lZC1SYW5nZT1ieXRlcyUzRDM5MTEwOTA2LTU4MzM0MjE3JlgtWGV0LVNlc3Npb24tSWQ9dW5rbm93biIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc2MTAxNTQ0MH19fV19%26Signature%3DP20fV2sZz8kVF4dXA6T4KBafKprkni2IxR1FdtvTZZeslmdqVuW2vwbIhbdKcflMw9HBAb-vkKdSowMq8JAR4Tl~lmfkpz4AgyRc-tV7z4xpKuaQw9wx5hYD2hBLp1kTz~aSNCD59BCnjaMM~eZFoLegYgXS42ILqwsvkGRTB7J-EvEaqdgXtBqNSUwhyuPeOqRt19qYYpoUaDQBK7Vw0L2nQZu05QfS1cxP6vJj3TTCodZaSSWYdCcP-fckCNDCsNYyZqbxN1bTkNqAClaHSoj~EHQa43o1iLSW23shRjSVZS2Qw-RUxL1zNryMHUnAdBFxD2bHB3fJp3dfEd16jA__%26Key-Pair-Id%3DK2L8F4GPSG1IFC",
            "url_range": {
              "start": 39110906,
              "end": 58334217
            }
          }
        ],
        "3d0e209360ce0234973a761ae8d155722a865eb6ffb440aefa483e37f5a9bec3": [
          {
            "range": {
              "start": 0,
              "end": 1042
            },
            "url": "https://hf-proxy.example.com/?location=https%3A%2F%2Ftransfer.xethub.hf.co%2Fxorbs%2Fdefault%2F3d0e209360ce0234973a761ae8d155722a865eb6ffb440aefa483e37f5a9bec3%3FX-Xet-Signed-Range%3Dbytes%253D0-58369192%26X-Xet-Session-Id%3Dunknown%26Expires%3D1761015439%26Policy%3DeyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly90cmFuc2Zlci54ZXRodWIuaGYuY28veG9yYnMvZGVmYXVsdC8zZDBlMjA5MzYwY2UwMjM0OTczYTc2MWFlOGQxNTU3MjJhODY1ZWI2ZmZiNDQwYWVmYTQ4M2UzN2Y1YTliZWMzP1gtWGV0LVNpZ25lZC1SYW5nZT1ieXRlcyUzRDAtNTgzNjkxOTImWC1YZXQtU2Vzc2lvbi1JZD11bmtub3duIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzYxMDE1NDM5fX19XX0_%26Signature%3DEkjvd03gdBTPRk3lcuwdR57I-kXL6UM2z1F4JsVo0ld1M5v8jfqNzXIYx4fiavWZU6ViE1gcwf-bgMhm~zWegAnM6B1~Wgy43s2Hd6mwB6Hy~26p6qItU6z73XgkRaxYxOyWsJgRJ80ff-~H6WPK6E9wkUrthlHCo-U0C0bT1g~OqeYqZvn7In1s2eUZ8MqkyufRkuzu3ZyNpbdhYZwi2MdwB45cpRjH8dyiIcEXUH60c0yX2yz8MiQs5h4CF7OKDeRHx7jTYL3JNwruUAxwnJuDRV4N0puqwbeothAdmpKc7znhHqZyFxWCUmBm9V~CMSavFLF5XMb0ha0F-BWziQ__%26Key-Pair-Id%3DK2L8F4GPSG1IFC",
            "url_range": {
              "start": 0,
              "end": 58369192
            }
          }
        ]
      }
    };

    const result = replaceCasXetReconstructionResponse(response, 'example.com');

    expect(result).toEqual(expectedResponse);
  });
});
