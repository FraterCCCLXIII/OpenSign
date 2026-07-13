# Signer Signing Flow

This guide explains how signers complete a document in OpenSign and how features such as **Duplicate Widget Name**, **Auto Sign**, and the **Image Widget** work during the signing process.

---

# Duplicate Widget Name

The **Duplicate Widget Name** feature helps signers complete documents more efficiently by automatically populating widgets that share the same name.

## How it works

When multiple widgets of the **same type** have the **same widget name**, OpenSign treats them as linked fields.

After the signer fills in one of these widgets, the entered value is automatically copied to all other widgets with the same widget name.

### Example

- Three **Text** widgets named `address`
- Four **Email** widgets named `company_email`

When the signer enters a value in the first widget, all remaining widgets with the same name are automatically updated.

> **Note:** This feature does **not** apply to **Signature**, **Stamp**, or **Initials** widgets. These widgets use the **Auto Sign** feature instead. When clicked Auto Sign, completing the first Signature, Stamp, or Initials widget automatically fills all remaining matching widgets.

## Supported Widgets

Duplicate Widget Name is supported for the following widget types:

- Name
- Job Title
- Company
- Email
- Text

> **Important:** Widgets are linked only when both the **widget type** and the **widget name** are identical.

## Unsupported Widgets

Duplicate Widget Name is **not** supported for the following widget types:

- Number
- Date
- Checkbox
- Radio Button
- Dropdown
- Cells
- Attachment

Although you can assign the same widget name to these widgets while creating a document, they behave **independently** during the signing process.

### Example

Suppose a document contains two **Date** widgets with the same widget name, `agreement_date`.

When the signer selects a date in the first Date widget, the selected value is **not** copied to the second Date widget. Each Date widget must be completed individually.

The same behavior applies to all unsupported widget types listed above.

---

# Auto Sign

The **Auto Sign** feature allows signers to complete **Signature**, **Stamp**, or **Initials** only once. After the first widget is completed, OpenSign automatically fills all other matching widgets where **Auto Sign** is enabled.

This reduces repetitive actions and speeds up the signing process.

## Signature Widget

When **Auto Sign** is enabled:

1. Click the first Signature widget.
2. Create the signature by:
   - Drawing
   - Typing
   - Uploading
   - Selecting a previously saved signature (if available)
3. Click **Auto Sign**.
4. OpenSign automatically fills all remaining Signature widgets that have Auto Sign enabled.

The signer only needs to sign once.

---

## Stamp Widget

When **Auto Sign** is enabled:

1. Click the first Stamp widget.
2. Upload a stamp or select a previously saved stamp (if available).
3. Click **Auto Sign**.
4. All remaining Stamp widgets with Auto Sign enabled are automatically completed.

---

## Initials Widget

When **Auto Sign** is enabled:

1. Click the first Initials widget.
2. Create the initials by:
   - Drawing
   - Typing
   - Uploading
   - Selecting previously saved initials (if available)
3. Click **Auto Sign**.
4. OpenSign automatically fills all remaining Initials widgets that have Auto Sign enabled.

---

# Image Widget

The **Image** widget allows signers to upload an image during the signing process.

Common use cases include:

- Company logo
- Passport photo
- Profile picture
- Supporting document image
- Identity verification image

## How it works

1. Click the Image widget.
2. Select an image from your device.
3. Upload the image.
4. Click **Auto Sign**.

If multiple **Image** widgets have the **same widget name**, clicking **Auto Sign** automatically fills all Image widgets with that same name using the uploaded image.

Image widgets with **different widget names** are **not** linked and will not be updated.

> **Note:** Image widgets are linked only when both the **widget type** and **widget name** are identical.
