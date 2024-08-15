# Sublink Worker API Documentation

## Overview

Sublink Worker is a lightweight subscription conversion tool deployed on Cloudflare Workers. It converts various proxy protocol share URLs into subscription links usable by different clients. This document outlines the API endpoints and their usage.

## Base URL

All API requests should be made to:

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
  - `selectedRules` (optional): Either a predefined rule set name or a JSON array of custom rules

**Example**:
```
/singbox?config=vmess%3A%2F%2Fexample&selectedRules=balanced
```
or
```
/singbox?config=vmess%3A%2F%2Fexample&selectedRules=%5B%22Ad%20Block%22%2C%22Private%22%5D
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

- `minimal`: Basic set of rules
- `balanced`: Moderate set of rules
- `comprehensive`: Full set of rules

These can be used in the `selectedRules` parameter for Sing-Box and Clash configurations.

## Custom Rules

Instead of using predefined rule sets, you can provide a custom list of rules as a JSON array in the `selectedRules` parameter. Available rules include:

| Rule Name | Used Site Rules | Used IP Rules |
|---|---|---|
| Ad Block | category-ads-all |  |
| AI Services | openai,anthropic,jetbrains-ai |  |
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
| Financial | paypal, visa, mastercard |  |
| Cloud Services | aws, azure, digitalocean, heroku, dropbox |  |

## Error Handling

The API will return appropriate HTTP status codes along with error messages in case of issues:

- 400 Bad Request: When required parameters are missing or invalid
- 404 Not Found: When a requested resource (e.g., short URL) doesn't exist
- 500 Internal Server Error: For server-side errors

## Usage Notes

1. All proxy configurations in the `config` parameter should be URL-encoded.
2. Multiple proxy configurations can be included in a single request by separating them with newline characters (`%0A`) in the URL-encoded `config` parameter.
3. When using custom rules, ensure the rule names exactly match those listed in the Custom Rules section.
4. The shortened URLs are meant to be temporary and may expire after a certain period.

## Examples

1. Generate a Sing-Box configuration with a balanced rule set:
   ```
   /singbox?config=vmess%3A%2F%2Fexample&selectedRules=balanced
   ```

2. Generate a Clash configuration with custom rules:
   ```
   /clash?config=vless%3A%2F%2Fexample&selectedRules=%5B%22Ad%20Block%22%2C%22Google%22%2C%22Streaming%22%5D
   ```

3. Shorten a URL:
   ```
   /shorten?url=https%3A%2F%2Fyour-worker-domain.workers.dev%2Fsingbox%3Fconfig%3Dvmess%253A%252F%252Fexample%26selectedRules%3Dbalanced
   ```

## Conclusion

This API provides a flexible and powerful way to generate and manage proxy configurations. It supports multiple proxy protocols, various client types, and customizable routing rules. The URL shortening feature allows for easy sharing and management of complex configurations.

For any issues or feature requests, please contact the repository maintainer.