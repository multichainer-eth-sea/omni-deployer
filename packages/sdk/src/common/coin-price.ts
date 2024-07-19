export type CoinPrice = {
  price: number;
  symbol: string;
  timestamp: number;
  confidence: number;
};

export type CoinPriceMap = {
  coins: Record<string, CoinPrice>;
};

export async function getCoinMetadata(
  coinIds: string[],
): Promise<CoinPriceMap> {
  const coinIdsString = coinIds.join(',');
  const baseUrl = 'https://coins.llama.fi/prices/current';
  const url = `${baseUrl}/${coinIdsString}`;

  const response = await fetch(url);
  const json = (await response.json()) as CoinPriceMap;

  return json;
}

export async function getCoinPriceById(coinId: string): Promise<number> {
  const coinMetadata = await getCoinMetadata([coinId]);
  return coinMetadata.coins[coinId].price;
}
