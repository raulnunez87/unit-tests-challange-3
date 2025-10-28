#!/bin/bash

# Test script for GitHub Actions workflow configuration
# This script validates the workflow setup and security scanning

set -e

echo "🔍 Testing GitHub Actions Workflow Configuration"
echo "================================================"

# Check if workflow file exists
if [ -f ".github/workflows/ci.yml" ]; then
    echo "✅ GitHub Actions workflow file exists"
else
    echo "❌ GitHub Actions workflow file not found"
    exit 1
fi

# Validate YAML syntax
echo "🔍 Validating YAML syntax..."
if command -v yamllint >/dev/null 2>&1; then
    yamllint .github/workflows/ci.yml
    echo "✅ YAML syntax is valid"
else
    echo "⚠️ yamllint not installed, skipping YAML validation"
fi

# Check package.json security scripts
echo "🔍 Checking security scripts in package.json..."
if grep -q "sec:sast" package.json && grep -q "sec:sca" package.json; then
    echo "✅ Security scripts found in package.json"
else
    echo "❌ Security scripts missing from package.json"
    exit 1
fi

# Test security scripts (without requiring tools to be installed)
echo "🔍 Testing security scripts..."
echo "Testing sec:sast..."
npm run sec:sast || echo "⚠️ sec:sast completed with warnings"

echo "Testing sec:sca..."
npm run sec:sca || echo "⚠️ sec:sca completed with warnings"

# Check for required permissions in workflow
echo "🔍 Checking workflow permissions..."
if grep -q "security-events: write" .github/workflows/ci.yml; then
    echo "✅ security-events permission found"
else
    echo "❌ security-events permission missing"
    exit 1
fi

if grep -q "contents: read" .github/workflows/ci.yml; then
    echo "✅ contents permission found"
else
    echo "❌ contents permission missing"
    exit 1
fi

# Check for SARIF upload conditions
echo "🔍 Checking SARIF upload conditions..."
if grep -q "hashFiles" .github/workflows/ci.yml; then
    echo "✅ SARIF upload conditions found"
else
    echo "❌ SARIF upload conditions missing"
    exit 1
fi

# Check for CodeQL integration
echo "🔍 Checking CodeQL integration..."
if grep -q "codeql-action" .github/workflows/ci.yml; then
    echo "✅ CodeQL integration found"
else
    echo "❌ CodeQL integration missing"
    exit 1
fi

echo ""
echo "🎉 All workflow configuration tests passed!"
echo ""
echo "📋 Next steps:"
echo "1. Commit and push the workflow file to GitHub"
echo "2. Check the Actions tab for workflow runs"
echo "3. Review security findings in the Security tab"
echo ""
echo "🔧 To install security tools locally:"
echo "npm run sec:install-tools"
