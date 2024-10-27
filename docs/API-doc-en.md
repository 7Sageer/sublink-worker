# Sublink Worker API Documentation

## Overview

Sublink Worker is a lightweight subscription conversion tool deployed on Cloudflare Workers. It can convert shared URLs of various proxy protocols into subscription links usable by different clients. This document outlines the API endpoints and their usage.

## Base URL

All API requests should be sent to:

```
https://your-worker-domain.workers.dev
```

Replace `your-worker-domain` with your actual Cloudflare Workers domain.

## Endpoints

### 1. Generate Configuration

#### Sing-Box Configuration

- **URL**: `/singbox`
- **Method**: GET
- **Parameters**:
  - `config` (required): URL-encoded string containing one or more proxy configurations
  - `selectedRules` (optional): Name of a predefined rule set or JSON array of custom rules
  - `customRules` (optional): JSON array of custom rules

**Example**:
```
/singbox?config=vmess%3A%2F%2Fexample&selectedRules=balanced&customRules=%5B%7B%22sites%22%3A%5B%22example.com%22%5D%2C%22ips%22%3A%5B%22192.168.1.1%22%5D%2C%22domain_suffix%22%3A%5B%22.com%22%5D%2C%22ip_cidr%22%3A%5B%2210.0.0.0%2F8%22%5D%2C%22outbound%22%3A%22MyCustomRule%22%7D%5D
```

#### Clash Configuration

- **URL**: `/clash`
- **Method**: GET
- **Parameters**: Same as Sing-Box configuration

#### Xray Configuration

- **URL**: `/xray`
- **Method**: GET
- **Parameters**:
  - `config` (required): URL-encoded string containing one or more proxy configurations

### 2. Shorten URL

- **URL**: `/shorten`
- **Method**: GET
- **Parameters**:
  - `url` (required): The original URL to be shortened

**Example**:
```
/shorten?url=https%3A%2F%2Fexample.com%2Fvery-long-url
```

**Response**:
```json
{
  "shortUrl": "https://your-worker-domain.workers.dev/s/abcdefg"
}
```

### 3. Redirect Short URL

- **URL**: `/s/{shortCode}`
- **Method**: GET
- **Description**: Redirects to the original URL associated with the short code

## Predefined Rule Sets

The API supports the following predefined rule sets:

- `minimal`: Basic rule set
- `balanced`: Moderate rule set
- `comprehensive`: Complete rule set

These can be used in the `selectedRules` parameter for Sing-Box and Clash configurations.

Here are the currently supported predefined rule sets:

| Rule Name | Used Site Rules | Used IP Rules |
|---|---|---|
| Ad Block | category-ads-all |  |
| AI Services | openai,anthropic,jetbrains-ai,perplexity |  |
| Bilibili | bilibili |  |
| Youtube | youtube |  |
| Google | google | google |
| Private |  | private |
| Location:CN | geolocation-cn | cn |
| Telegram |  | telegram |
| Microsoft | microsoft |  |
| Apple | apple |  |
| Bahamut | bahamut |  |
| Social Media | facebook, instagram, twitter, tiktok, linkedin |  |
| Streaming | netflix, hulu, disney, hbo, amazon |  |
| Gaming | steam, epicgames, ea, ubisoft, blizzard |  |
| Github | github, gitlab |  |
| Education | coursera, edx, udemy, khanacademy |  |
| Financial | paypal, visa, mastercard, stripe, wise |  |
| Cloud Services | aws, azure, digitalocean, heroku, dropbox |  |

The rule sets for Singbox are from [https://github.com/lyc8503/sing-box-rules](https://github.com/lyc8503/sing-box-rules), thanks to lyc8503 for the contribution!

## Custom Rules

In addition to using predefined rule sets, you can provide a list of custom rules in the `customRules` parameter as a JSON array. Each custom rule should contain the following fields:

- `sites`: Array of domain rules
- `ips`: Array of IP rules
- `domain_suffix`: Array of domain suffix rules
- `domain_keyword`: Array of domain keyword rules
- `ip_cidr`: Array of IP CIDR rules
- `outbound`: Outbound name

Example:

```json
[
  {
    "sites": ["google", "anthropic"],
    "ips": ["private", "cn"],
    "domain_suffix": [".com", ".org"],
    "domain_keyword": ["Mijia Cloud", "push.apple"],
    "ip_cidr": ["192.168.0.0/16", "10.0.0.0/8"],
    "outbound": "🤪 MyCustomRule"
  }
]
```
You can also use the `pin` parameter to place a custom rule on top of a predefined rule in order for the custom rule to take effect.

## Error Handling

The API will return appropriate HTTP status codes and error messages when problems occur:

- 400 Bad Request: When required parameters are missing or invalid
- 404 Not Found: When the requested resource (such as a short URL) doesn't exist
- 500 Internal Server Error: Server-side errors

## Usage Notes

1. All proxy configurations in the `config` parameter should be URL-encoded.
2. Multiple proxy configurations can be included in a single request by separating them with newlines (`%0A`) in the URL-encoded `config` parameter.
3. When using custom rules, ensure that the rule names match exactly with those listed in the custom rules section.
4. Shortened URLs are intended for temporary use and may expire after a certain period.

## Examples

1. Generate a Sing-Box configuration with balanced rule set:
   ```
   /singbox?config=vmess%3A%2F%2Fexample&selectedRules=balanced
   ```

2. Generate a Clash configuration with custom rules of the top:
   ```
   /clash?config=vless%3A%2F%2Fexample&customRules=%5B%7B%22sites%22%3A%5B%22example.com%22%5D%2C%22ips%22%3A%5B%22192.168.1.1%22%5D%2C%22domain_suffix%22%3A%5B%22.com%22%5D%2C%22domain_keyword%22%3A%5B%22Mijia%20Cloud%22%5D%2C%22ip_cidr%22%3A%5B%2210.0.0.0%2F8%22%5D%2C%22outbound%22%3A%22MyCustomRule%22%7D%5D&pin=true
   ```

3. Shorten a URL:
   ```
   /shorten?url=https%3A%2F%2Fyour-worker-domain.workers.dev%2Fsingbox%3Fconfig%3Dvmess%253A%252F%252Fexample%26selectedRules%3Dbalanced
   ```

## Conclusion

The Sublink Worker API provides a flexible and powerful way to generate and manage proxy configurations. It supports multiple proxy protocols, various client types, and customizable routing rules. The URL shortening feature allows for easy sharing and management of complex configurations.

For any questions or feature requests, please contact [@7Sageer](https://github.com/7Sageer).