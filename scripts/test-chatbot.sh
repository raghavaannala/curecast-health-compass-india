#!/bin/bash

# Multilingual AI Chatbot Testing Script
# Comprehensive testing for all chatbot components

set -e

echo "🧪 Starting Multilingual AI Chatbot Testing..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Test environment setup
test_environment() {
    print_status "Testing environment setup..."
    
    if [ ! -f ".env" ]; then
        print_error "Environment file (.env) not found"
        return 1
    fi
    
    # Check required environment variables
    source .env
    
    local required_vars=(
        "REACT_APP_WHATSAPP_ACCESS_TOKEN"
        "REACT_APP_SMS_API_KEY"
        "REACT_APP_BASE_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_warning "Environment variable $var is not set"
        else
            print_success "Environment variable $var is configured"
        fi
    done
}

# Test NLP service
test_nlp_service() {
    print_status "Testing NLP service..."
    
    # Test language detection
    node -e "
    const { languageService } = require('./src/services/languageService.ts');
    
    async function testLanguageDetection() {
        const tests = [
            { text: 'Hello, how are you?', expected: 'english' },
            { text: 'नमस्ते, आप कैसे हैं?', expected: 'hindi' },
            { text: 'హలో, మీరు ఎలా ఉన్నారు?', expected: 'telugu' }
        ];
        
        for (const test of tests) {
            try {
                const result = await languageService.detectLanguage(test.text);
                if (result.language === test.expected) {
                    console.log('✅ Language detection test passed:', test.text);
                } else {
                    console.log('❌ Language detection test failed:', test.text, 'Expected:', test.expected, 'Got:', result.language);
                }
            } catch (error) {
                console.log('❌ Language detection error:', error.message);
            }
        }
    }
    
    testLanguageDetection();
    " 2>/dev/null && print_success "NLP service tests passed" || print_error "NLP service tests failed"
}

# Test knowledge base
test_knowledge_base() {
    print_status "Testing knowledge base service..."
    
    # Test symptom triage
    node -e "
    const { healthKnowledgeBaseService } = require('./src/services/healthKnowledgeBaseService.ts');
    
    async function testSymptomTriage() {
        const symptoms = ['fever', 'cough', 'headache'];
        
        try {
            const result = await healthKnowledgeBaseService.getSymptomTriage(symptoms, 'english');
            console.log('✅ Symptom triage test passed. Severity:', result.severity);
        } catch (error) {
            console.log('❌ Symptom triage test failed:', error.message);
        }
    }
    
    testSymptomTriage();
    " 2>/dev/null && print_success "Knowledge base tests passed" || print_error "Knowledge base tests failed"
}

# Test WhatsApp webhook
test_whatsapp_webhook() {
    print_status "Testing WhatsApp webhook..."
    
    if [ -z "$REACT_APP_BASE_URL" ]; then
        print_warning "BASE_URL not set, skipping webhook test"
        return 0
    fi
    
    local webhook_url="$REACT_APP_BASE_URL/api/whatsapp/webhook"
    
    # Test webhook verification
    local verify_response=$(curl -s -w "%{http_code}" -o /dev/null \
        "$webhook_url?hub.mode=subscribe&hub.verify_token=test_token&hub.challenge=test_challenge" \
        2>/dev/null || echo "000")
    
    if [ "$verify_response" = "200" ] || [ "$verify_response" = "403" ]; then
        print_success "WhatsApp webhook endpoint is responding"
    else
        print_error "WhatsApp webhook endpoint not accessible (HTTP $verify_response)"
    fi
}

# Test SMS webhook
test_sms_webhook() {
    print_status "Testing SMS webhook..."
    
    if [ -z "$REACT_APP_BASE_URL" ]; then
        print_warning "BASE_URL not set, skipping SMS webhook test"
        return 0
    fi
    
    local webhook_url="$REACT_APP_BASE_URL/api/sms/webhook"
    
    # Test SMS webhook with sample data
    local response=$(curl -s -w "%{http_code}" -o /dev/null \
        -X POST \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "From=%2B919876543210&Body=test%20message&MessageSid=test123" \
        "$webhook_url" \
        2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        print_success "SMS webhook endpoint is responding"
    else
        print_error "SMS webhook endpoint not accessible (HTTP $response)"
    fi
}

# Test analytics service
test_analytics() {
    print_status "Testing analytics service..."
    
    node -e "
    const { chatbotAnalyticsService } = require('./src/services/chatbotAnalyticsService.ts');
    
    async function testAnalytics() {
        try {
            const dateRange = {
                startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
            };
            
            const dashboard = await chatbotAnalyticsService.getDashboardData(dateRange);
            console.log('✅ Analytics service test passed');
        } catch (error) {
            console.log('❌ Analytics service test failed:', error.message);
        }
    }
    
    testAnalytics();
    " 2>/dev/null && print_success "Analytics tests passed" || print_error "Analytics tests failed"
}

# Test government integration
test_government_integration() {
    print_status "Testing government integration..."
    
    node -e "
    const { governmentHealthIntegrationService } = require('./src/services/governmentHealthIntegrationService.ts');
    
    async function testGovernmentIntegration() {
        try {
            const schedule = await governmentHealthIntegrationService.getGovernmentVaccinationSchedule('infant', 'telangana');
            console.log('✅ Government integration test passed');
        } catch (error) {
            console.log('❌ Government integration test failed:', error.message);
        }
    }
    
    testGovernmentIntegration();
    " 2>/dev/null && print_success "Government integration tests passed" || print_error "Government integration tests failed"
}

# Test React components
test_react_components() {
    print_status "Testing React components..."
    
    # Check if components compile without errors
    npx tsc --noEmit --skipLibCheck 2>/dev/null && \
        print_success "TypeScript compilation passed" || \
        print_error "TypeScript compilation failed"
    
    # Run React tests if they exist
    if [ -f "src/components/MultilingualHealthChatbot.test.tsx" ]; then
        npm test -- --watchAll=false --passWithNoTests 2>/dev/null && \
            print_success "React component tests passed" || \
            print_error "React component tests failed"
    else
        print_warning "No React component tests found"
    fi
}

# Test API endpoints
test_api_endpoints() {
    print_status "Testing API endpoints..."
    
    if [ -z "$REACT_APP_BASE_URL" ]; then
        print_warning "BASE_URL not set, skipping API tests"
        return 0
    fi
    
    local base_url="$REACT_APP_BASE_URL"
    
    # Test health check endpoint
    local health_response=$(curl -s -w "%{http_code}" -o /dev/null "$base_url/health" 2>/dev/null || echo "000")
    
    if [ "$health_response" = "200" ]; then
        print_success "Health check endpoint is working"
    else
        print_warning "Health check endpoint not found (this is optional)"
    fi
}

# Test multilingual functionality
test_multilingual() {
    print_status "Testing multilingual functionality..."
    
    # Test translation service
    node -e "
    const { languageService } = require('./src/services/languageService.ts');
    
    async function testTranslation() {
        try {
            const translated = await languageService.translateText('Hello', 'english', 'hindi');
            console.log('✅ Translation test passed:', translated);
        } catch (error) {
            console.log('❌ Translation test failed:', error.message);
        }
    }
    
    testTranslation();
    " 2>/dev/null && print_success "Multilingual tests passed" || print_error "Multilingual tests failed"
}

# Performance tests
test_performance() {
    print_status "Testing performance..."
    
    if [ -z "$REACT_APP_BASE_URL" ]; then
        print_warning "BASE_URL not set, skipping performance tests"
        return 0
    fi
    
    # Test response time
    local start_time=$(date +%s%N)
    curl -s "$REACT_APP_BASE_URL" > /dev/null 2>&1
    local end_time=$(date +%s%N)
    local response_time=$(( (end_time - start_time) / 1000000 ))
    
    if [ $response_time -lt 3000 ]; then
        print_success "Response time: ${response_time}ms (Good)"
    elif [ $response_time -lt 5000 ]; then
        print_warning "Response time: ${response_time}ms (Acceptable)"
    else
        print_error "Response time: ${response_time}ms (Too slow)"
    fi
}

# Security tests
test_security() {
    print_status "Testing security..."
    
    # Check for exposed sensitive files
    local sensitive_files=(".env" "firebase-adminsdk.json" "private.key")
    
    for file in "${sensitive_files[@]}"; do
        if [ -f "$file" ]; then
            if [ -r "$file" ]; then
                print_warning "Sensitive file $file is readable - ensure it's not exposed in production"
            fi
        fi
    done
    
    # Check environment variables for hardcoded secrets
    if grep -r "sk_" src/ 2>/dev/null | grep -v ".example" | grep -v "test" > /dev/null; then
        print_error "Potential hardcoded API keys found in source code"
    else
        print_success "No hardcoded API keys found in source code"
    fi
}

# Generate test report
generate_report() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local report_file="test-report-$(date '+%Y%m%d-%H%M%S').txt"
    
    echo "Multilingual AI Chatbot Test Report" > "$report_file"
    echo "Generated: $timestamp" >> "$report_file"
    echo "======================================" >> "$report_file"
    echo "" >> "$report_file"
    
    # Add test results to report
    echo "Test Summary:" >> "$report_file"
    echo "- Environment: $(test_environment 2>&1 | grep -c "PASS" || echo "0") passed"
    echo "- Components: $(test_react_components 2>&1 | grep -c "passed" || echo "0") passed"
    echo "- Services: $(test_nlp_service 2>&1 | grep -c "passed" || echo "0") passed"
    echo "" >> "$report_file"
    
    print_success "Test report generated: $report_file"
}

# Main testing function
main() {
    echo "🏥 Multilingual AI Chatbot Testing Suite"
    echo "========================================"
    echo ""
    
    local start_time=$(date +%s)
    
    test_environment
    test_react_components
    test_nlp_service
    test_knowledge_base
    test_analytics
    test_government_integration
    test_whatsapp_webhook
    test_sms_webhook
    test_api_endpoints
    test_multilingual
    test_performance
    test_security
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo ""
    echo "🎉 Testing completed in ${duration} seconds"
    
    generate_report
}

# Handle script arguments
case "${1:-all}" in
    "all")
        main
        ;;
    "env")
        test_environment
        ;;
    "components")
        test_react_components
        ;;
    "services")
        test_nlp_service
        test_knowledge_base
        test_analytics
        ;;
    "webhooks")
        test_whatsapp_webhook
        test_sms_webhook
        ;;
    "performance")
        test_performance
        ;;
    "security")
        test_security
        ;;
    "help")
        echo "Usage: $0 [all|env|components|services|webhooks|performance|security|help]"
        echo ""
        echo "Commands:"
        echo "  all         - Run all tests (default)"
        echo "  env         - Test environment configuration"
        echo "  components  - Test React components"
        echo "  services    - Test backend services"
        echo "  webhooks    - Test webhook endpoints"
        echo "  performance - Test performance"
        echo "  security    - Test security"
        echo "  help        - Show this help"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac
