# AddContentModal.jsx - Unused Items Report

## ❌ UNUSED CONSTANTS

### 1. `CONTENT_TYPES` (Lines 12-16)
**Status**: NOT USED
**Reason**: The code uses string literals directly ('file', 'link', 'template') instead of referencing `CONTENT_TYPES.FILE`, `CONTENT_TYPES.LINK`, etc.

**Found usages of string literals instead:**
- Line 170: `let contentType = 'file';`
- Line 173: `if (editContent.contentType === 'link')`
- Line 175: `contentType = 'template';`
- Line 562: `if (contentType === 'file' && !formData.file && !editMode)`
- Line 566: `if (contentType === 'link')`

**Recommendation**: Remove `CONTENT_TYPES` constant or refactor code to use it.

### 2. `STEPS` (Lines 18-24)
**Status**: NOT USED
**Reason**: The code uses direct numeric comparisons (`currentStep === 1`, `currentStep === 2`, etc.) instead of referencing `STEPS.UPLOAD`, `STEPS.ASSIGN`, etc.

**Found usages of direct comparisons:**
- Line 557: `if (currentStep === 1)`
- Line 596: `if (currentStep === 2)`
- Line 608: `if (currentStep === 4 && !editMode)`
- Line 1432: `{currentStep === 1 && (`
- Line 1624: `{currentStep === 2 && (`
- Line 1846: `{currentStep === 3 && (`
- Line 2024: `{currentStep === 4 && !editMode && (`
- Line 2269: `{((!editMode && currentStep === 5) || (editMode && currentStep === 4)) && (`

**Recommendation**: Remove `STEPS` constant or refactor code to use it.

## ❌ UNUSED STATE VARIABLES

### 3. `showFileReplaceConfirm` (Line 55)
**Status**: NOT USED
**Reason**: Declared but never set or read anywhere in the component.

**Declaration:**
```javascript
const [showFileReplaceConfirm, setShowFileReplaceConfirm] = useState(false);
```

**Recommendation**: Remove this state variable if file replacement confirmation is not needed, or implement the feature if it was planned.

## ✅ USED ITEMS (All Good)

### Imports - All Used:
- ✅ `React, useState, useEffect` - Used throughout
- ✅ `useNavigate` - Used on lines 41, 951, 955
- ✅ `Upload, Link, LayoutTemplate, Users, Clock, CheckCircle, Bell, CalendarIcon, X, Plus` - All icons used in JSX
- ✅ `Dialog, DialogContent, DialogHeader, DialogTitle` - Used for modal
- ✅ `Button` - Used in JSX
- ✅ All service imports (`uploadContent`, `createLinkContent`, etc.) - All used
- ✅ CSS imports - Used

### State Variables - All Used:
- ✅ `showContentOptions` - Used to toggle content type selection
- ✅ `currentStep` - Used for multi-step form navigation
- ✅ `contentType` - Used to determine content type
- ✅ `isLoading` - Used for loading states
- ✅ `error` - Used for error handling
- ✅ `availableTemplates` - Used to display templates
- ✅ `availableDepartments` - Used to display departments
- ✅ `availableGroups` - Used to display groups
- ✅ `availableTrainees` - Used to display trainees
- ✅ `userRole` - Used to determine UI based on role
- ✅ `urlValidationError` - Used for URL validation feedback
- ✅ `isValidatingUrl` - Used for URL validation loading state
- ✅ `urlValidationStatus` - Used for URL validation status
- ✅ `loadingQuizzes` - Used for quiz loading state
- ✅ `numQuestionsToGenerate` - Used for AI question generation
- ✅ `showQuestionCountDialog` - Used to show question count dialog
- ✅ `customAlert` - Used for custom alert messages
- ✅ `formData` - Used throughout for form state

### Constants - Used:
- ✅ `categories` - Used on line 1500 in dropdown

### Functions - All Used:
- ✅ `getEffectiveGroupId()` - Used to get group ID from URL
- ✅ `effectiveGroupId` - Used in multiple places
- ✅ `showAlert()` - Used extensively for user feedback
- ✅ `closeAlert()` - Used to close alerts
- ✅ `getSteps()` - Used to generate step indicators
- ✅ All other functions are used

## 📊 SUMMARY

**Total Unused Items**: 3
- 2 unused constants (`CONTENT_TYPES`, `STEPS`)
- 1 unused state variable (`showFileReplaceConfirm`)

**Recommendation**: 
1. Remove unused constants or refactor code to use them for better maintainability
2. Remove `showFileReplaceConfirm` state if not needed, or implement the feature

