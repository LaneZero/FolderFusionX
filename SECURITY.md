# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within FolderFusionX, please send an email to security@example.com. All security vulnerabilities will be promptly addressed.

Please include the following information in your report:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

## GitHub Token Security

FolderFusionX allows users to provide GitHub personal access tokens to increase API rate limits and access private repositories. We take the security of these tokens seriously:

1. **Storage**: Tokens are stored only in your browser's session storage, which is cleared when you close your browser.
2. **Encryption**: Tokens are encoded before storage to provide a basic level of obfuscation.
3. **Transmission**: Tokens are only sent directly to GitHub's API over HTTPS, never to our servers.
4. **Scope**: We recommend using tokens with minimal permissions (public_repo scope only).

## Best Practices for Users

1. **Create Limited Tokens**: When creating a GitHub token for use with FolderFusionX, only grant the minimum permissions needed.
2. **Use Temporary Tokens**: Consider creating temporary tokens that you can delete after use.
3. **Close Browser**: Close your browser when finished to clear session storage.
4. **Regular Rotation**: Regularly rotate your GitHub tokens.
5. **Public Computers**: Never use your GitHub tokens on public or shared computers.

## Commitment to Security

We are committed to ensuring the security of our application and protecting user data. We regularly review our code for security vulnerabilities and keep dependencies updated.