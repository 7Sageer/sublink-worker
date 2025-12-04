/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */

import { TextareaWithActions } from './TextareaWithActions.jsx';

const DEFAULT_ACTION_CLASS =
  'px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded transition-colors flex items-center gap-1';
const DEFAULT_VALIDATE_CLASS =
  'px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1';

const createAction = (action = {}, defaults = {}) => {
  const final = {
    key: action.key,
    icon: action.icon,
    label: action.label,
    hideLabelOnMobile: action.hideLabelOnMobile,
    className: action.className || defaults.className,
    title: action.title || action.label,
    attrs: action.attrs || defaults.attrs || {}
  };
  return final;
};

const renderValidationMessage = (config, fallbackClass, defaultIcon) => {
  if (!config) return null;
  const attrs = {};
  if (config.show) {
    attrs['x-show'] = config.show;
  }
  return (
    <div class={config.className || fallbackClass} {...attrs}>
      <i class={config.icon || defaultIcon}></i>
      {config.text ? (
        <span>{config.text}</span>
      ) : config.textExpr ? (
        <span x-text={config.textExpr}></span>
      ) : null}
    </div>
  );
};

export const ValidatedTextarea = (props) => {
  const {
    model,
    paste = true,
    clear = true,
    pasteLabel = 'Paste',
    clearLabel = 'Clear',
    pasteTitle = pasteLabel,
    clearTitle = clearLabel,
    labelActions = [],
    inlineActions = [],
    validation = {},
    children,
    ...rest
  } = props;

  const computedLabelActions = [...labelActions];
  if (paste && model) {
    const pasteConfig = typeof paste === 'object' ? paste : {};
    computedLabelActions.push(
      createAction(
        {
          key: pasteConfig.key || `paste-${model}`,
          icon: pasteConfig.icon || 'fas fa-paste',
          label: pasteConfig.label || pasteLabel,
          hideLabelOnMobile: pasteConfig.hideLabelOnMobile !== false,
          className:
            pasteConfig.className ||
            `${DEFAULT_ACTION_CLASS} hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400`,
          title: pasteConfig.title || pasteTitle,
          attrs:
            pasteConfig.attrs || {
              'x-on:click': `navigator.clipboard.readText().then(text => ${model} = text).catch(() => {})`
            }
        },
        {}
      )
    );
  }

  if (clear && model) {
    const clearConfig = typeof clear === 'object' ? clear : {};
    computedLabelActions.push(
      createAction(
        {
          key: clearConfig.key || `clear-${model}`,
          icon: clearConfig.icon || 'fas fa-times',
          label: clearConfig.label || clearLabel,
          hideLabelOnMobile: clearConfig.hideLabelOnMobile !== false,
          className:
            clearConfig.className ||
            `${DEFAULT_ACTION_CLASS} hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400`,
          title: clearConfig.title || clearTitle,
          attrs:
            clearConfig.attrs || {
              'x-on:click': `${model} = ''`,
              'x-show': model
            }
        },
        {}
      )
    );
  }

  const computedInlineActions = [...inlineActions];
  if (validation?.button) {
    computedInlineActions.push(
      createAction(validation.button, {
        className: DEFAULT_VALIDATE_CLASS,
        attrs: {}
      })
    );
  }

  return (
    <TextareaWithActions
      {...rest}
      model={model}
      labelActions={computedLabelActions}
      inlineActions={computedInlineActions}
    >
      {children}
      {renderValidationMessage(
        validation?.error,
        'mt-2 text-red-500 text-sm flex items-center gap-1',
        'fas fa-exclamation-circle'
      )}
      {renderValidationMessage(
        validation?.success,
        'mt-2 text-green-500 text-sm flex items-center gap-1',
        'fas fa-check-circle'
      )}
    </TextareaWithActions>
  );
};
