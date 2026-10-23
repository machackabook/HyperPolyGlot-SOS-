import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location('omni',Path(__file__).parents[1]/'tools'/'omni_automation_matrix.py')
omni=importlib.util.module_from_spec(spec)
spec.loader.exec_module(omni)

class OmniTests(unittest.TestCase):
    def fixture(self):
        # Unit-test fixture only; never described as sensor telemetry.
        patches=[[float(i+j) for i in range(9)] for j in range(9)]
        raw={'spatial':[1.,2.,3.],'spectrum':[2.,3.,4.],'patches':patches,'fork':12.}
        target={'spatial':[2.,4.,3.],'spectrum':[1.5,2.5,3.5],
                'patches':[[v*.95 for v in row] for row in patches],'fork':11.}
        return {'samples':[{'raw':raw,'target':target}]}
    def test_real_loss_decreases_for_known_fixture(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'fixture.json';p.write_text(json.dumps(self.fixture()))
            data=omni.read_dataset(p)
            report=omni.UnifiedTelemetryOptimizer().optimize(data,30)
            self.assertLess(report['finalLoss'],report['initialLoss'])
            self.assertEqual(report['source'],'user-file-calibration')
    def test_bad_patch_shape_rejected(self):
        fixture=self.fixture();fixture['samples'][0]['raw']['patches']=[]
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'fixture.json';p.write_text(json.dumps(fixture))
            with self.assertRaises(ValueError):omni.read_dataset(p)
    def test_blank_ascii_map_has_no_invented_signal(self):
        m=omni.OffscreenCanvasRenderer()
        self.assertEqual(set(m.ascii_map().replace('\n','')),{ ' ' })

if __name__=='__main__':unittest.main()
