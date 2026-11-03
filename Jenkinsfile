pipeline {
    agent any

    environment {
        PYTHONUNBUFFERED = '1'
        BUILD_TAG = "v1.0.${BUILD_NUMBER}"
        PORT = '8000'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing required Python packages...'
                sh 'python3 -m pip install --upgrade pip'
                sh 'python3 -m pip install -r backend/requirements.txt'
            }
        }

        stage('Automated Unit Tests') {
            steps {
                echo 'Running pytest suite...'
                sh 'python3 -m pytest backend/test_main.py'
            }
        }

        stage('Package Artifact') {
            steps {
                echo "Packaging artifact with build version: ${BUILD_TAG}"
                sh "tar -czvf devmind_backend_${BUILD_TAG}.tar.gz backend/"
            }
        }

        stage('Deploy Application') {
            steps {
                echo "Deploying FastAPI backend server on port ${PORT}..."
                sh 'lsof -ti:8000 | xargs kill -9 2>/dev/null || true'
                sh 'JENKINS_NODE_COOKIE=dontKillMe nohup python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 > uvicorn.log 2>&1 &'
                sh 'sleep 4'
                sh 'curl -s http://localhost:8000/health | grep healthy'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: "devmind_backend_*.tar.gz", allowEmptyArchive: true
            echo "CI/CD Execution finished for build: ${BUILD_TAG}"
        }
        success {
            echo 'CI/CD Pipeline execution succeeded!'
        }
        failure {
            echo 'CI/CD Pipeline execution failed!'
        }
    }
}
