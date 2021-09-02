export enum SendFormErrorMessages {
  IncorrectAddressMode = 'The address is for the incorrect Stacks network',
  InvalidAddress = 'The address you provided is not valid',
  SameAddress = 'Cannot send to yourself',
  AmountRequired = 'You must specify an amount',
  MustNotBeZero = 'Must be more than zero',
  DoesNotSupportDecimals = 'This token does not support decimal places',
  InsufficientBalance = 'Insufficient balance. Your available balance is:',
  MustSelectAsset = 'You must select a valid token to transfer',
  TooMuchPrecision = '{token} can only have {decimals} decimals',
  MemoExceedsLimit = 'Memo must be less than 34-bytes',
  AdjustedFeeSurpassesBalance = 'AdjustedFeeSurpassesBalance',
}
