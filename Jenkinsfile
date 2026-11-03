pipeline {
    agent any

    environment {
        PYTHONUNBUFFERED = '1'
        BUILD_TAG = "v1.0.${BUILD_NUMBER}"
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
    }

    post {
        always {
            archiveArtifacts artifacts: "devmind_backend_*.tar.gz", allowEmptyArchive: true
            echo "CI Execution finished for build: ${BUILD_TAG}"
        }
        success {
            echo 'CI Pipeline execution succeeded!'
        }
        failure {
            echo 'CI Pipeline execution failed!'
        }
    }
}
