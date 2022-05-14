export const primaryBackground = ({ theme }) => `
  background: ${theme.color.primaryBackground};
  color: ${theme.color.primaryText};
`

export const secondaryBackground = ({ theme }) => `
  background: ${theme.color.secondaryBackground};
  color: ${theme.color.primaryText};
`

export const tertiaryBackground = ({ theme }) => `
  background: ${theme.color.tertiaryBackground};
  color: ${theme.color.primaryText};
`

export const inputBackground = ({ theme }) => `
  background: ${theme.color.inputBackground};
`

export const alertBackground = ({ theme }) => `
  background: ${theme.color.alertBackground};
  color: ${theme.color.alertText};
`

export const secondaryText = ({ theme }) => `
  color: ${theme.color.secondaryText};
`

export const secondaryBorder = ({ theme }) => `
  border-color: ${theme.color.secondaryText};
`

export const primaryButton = ({ theme }) => `
  background: ${theme.color.primaryButton};
  color: ${theme.color.primaryText};
  border-color: ${theme.color.primaryButton};
`

export const secondaryButton = ({ theme }) => `
  background: transparent;
  color: ${theme.color.primaryText};
  border: 1px solid ${theme.color.secondaryText};
`

export const primaryAnchor = ({ theme }) => `
  color: ${theme.color.primaryButton};
`
