# preprocess-js

# PACKAGE IS IN PREVIEW VERSION INTENDED FOR PERSONAL USE

## If u are still not scared away here is usage example for lack of documentation

```javascript
const { preprocess, cfg } = require("artemoire-preprocess");
const code = `
// %define TEST 1
console.log(TEST);
`

const processed = preprocess(code, {
  globals: '[FILE_CONTAINING_COMMENTED_DIRECTIVES]'
  includes: {
   SomeInc: '[FILE_CONTAINING_COMMENTED_DIRECTIVES]' 
   SomeOtherInc: '// %define KONST 32\n// %define OTHER_KONST 12' // like so
  }
  });
  
console.log(processed);
// OUTPUT: "\nconsole.log(1);"
```

### Supported Directives

- ifdef
- ifndef
- endif
- elif
- elifn
- else
- undef
- include (includes defines from includes property of config i.e // %include SomeOtherInc)
- echo (console.logs message on processing)
- error (throws exception on processing)
- /\*%%\*/ - similar to ## operator in the c preprocessor
