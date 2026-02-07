# Layout

## Information panel UI Components

### Header

Items such as "Heading", "Speed", "COG", "SOG", "Time", "Depth", "Sensor", "Datum", "Alt.", "XTE", "CTS".

### Data

Typically number or string + optional unit. Examples:

- 062.5°
- 22.0 kts
- 17:11:29
- 22.3 m
- 55°33.433'N 009°47.802'E
- WGS84
- 1.64 nm
- 17:24 03/01

Additional special data blocks are:

- Alarm messages. This should be a full-wide and tall box with read-only text of incoming alarm messages.
- Track cross-section. It should show visually the cross-track deviation from route. Attempted visual: | \* \* \*A\* \/\ \* \* \* \*|

### Row

A row usually has a header and a data block. Header is optional, in which case the data block will take full width of the information panel. A row can have multiple inline header + data combinations.

### Section

A section is made of rows. There can be multiple sections such as Charts, Routes, Tools, Main Menu

### Pushbutton

Square, can have text such as Select/Query Feature or Context Menu
