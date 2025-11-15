# Email Templates

Templates are simple HTML strings with a `{{CONTENT}}` placeholder.

## How It Works

1. AI generates email text
2. Template's `{{CONTENT}}` placeholder is replaced with that text
3. Final HTML is sent as email

## Creating a Template

Add to `template-variants.ts`:

```typescript
export const MY_TEMPLATE: EmailTemplate = {
    id: 'my-template',
    name: 'My Template Name',
    description: 'When to use this template',
    htmlTemplate: `
        <!DOCTYPE html>
        <html>
        <body>
            <div style="max-width: 600px; margin: 0 auto;">
                {{CONTENT}}
            </div>
        </body>
        </html>
    `,
    isDefault: false
};
```

Then add it to the `ALL_TEMPLATE_VARIANTS` array.

## Examples

**Plain Text:**

```typescript
htmlTemplate: '{{CONTENT}}'
```

**Simple HTML:**

```typescript
htmlTemplate: '<div style="font-family: Arial;">{{CONTENT}}</div>'
```

**Full HTML Email:**

```typescript
htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        {{CONTENT}}
    </div>
</body>
</html>
`
```

That's it!
