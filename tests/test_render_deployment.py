"""Deployment paths/branding; no live provider or Render requests."""
import json,os,subprocess,sys
from pathlib import Path
from fastapi.testclient import TestClient
from src import server,config
from tests.test_personal import client


def test_campusdecoded_brand_and_ephemeral_health(client,monkeypatch):
    monkeypatch.setattr(config,'STORAGE_MODE','ephemeral')
    response=client.get('/health');assert response.status_code==200
    assert response.json()['storage_mode']=='ephemeral'
    assert server.app.title=='CampusDecoded'
    page=client.get('/').text
    assert '<title>CampusDecoded</title>' in page and '>CD</span>' in page
    assert 'id="deployment-notice"' in page


def test_deployment_storage_path_is_opt_in(tmp_path):
    root=Path(__file__).resolve().parents[1]
    env={**os.environ,'CAMPUS_DATA_DIR':str(tmp_path/'demo-data'),'CHROMA_DIR':str(tmp_path/'demo-chroma')}
    code='import json;from src import config,institutions;print(json.dumps([str(config.DATA_ROOT),str(institutions.DATA_ROOT),str(config.DATA_RAW_DIR)]))'
    result=subprocess.run([sys.executable,'-c',code],cwd=root,env=env,capture_output=True,text=True,check=True)
    data=json.loads(result.stdout)
    assert data==[str(tmp_path/'demo-data'),str(tmp_path/'demo-data'),str(tmp_path/'demo-data/raw')]
    assert not (tmp_path/'demo-data').exists()


def test_free_blueprint_has_single_worker_and_no_secret_values():
    root=Path(__file__).resolve().parents[1];text=(root/'render.yaml').read_text()
    assert 'plan: free' in text and 'disk:' not in text
    assert '--workers 1' in text and '--host 0.0.0.0 --port $PORT' in text
    assert 'healthCheckPath: /health' in text
    assert 'sync: false' in text and 'generateValue: true' in text
