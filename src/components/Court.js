import React from 'react';
import {connect} from 'react-redux';
import {court as courtActions} from '../actions';
import { Form, Col } from 'react-bootstrap';
import {upload as uploadFileToS3} from '../s3';

class Court extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            courtName: this.props.match.params.courtName,
            court: null,
            loadFinish: false,
            score: "",
            review: "",
            formErrors: {
                score: ""
            },
            file: "",
            imagePreviewUrl: "",
            imageUploadError: "",
        }
    }

    async componentDidMount(){
        try {
            let court = await this.props.loadCourt(this.state.courtName);
            this.setState({
                loadFinish: true,
                court: court,
            })
        }   
        catch(err){
            alert(err);
        }
    }

    handleReview = async e => {
        e.preventDefault();
        this.validateReview()

        if ( this.isReviewFormValid() ){
            try{
                let res = await this.props.reviewCourt(this.state.courtName, this.state.score, this.state.review);
                alert("court reviewed");
                this.setState({

                });
            }
            catch(err){
                alert(err);
            }
        }
    }

    isReviewFormValid = () => {
        let valid = true;
        for(let field in this.state.formErrors ){
            if ( this.state.formErrors[field] !== "" ){
                valid = false;
            }
        }

        return valid;
    }

    validateReview = () => {
        let formErrors = this.state.formErrors;

        let score = this.state.score;
        if ( score === "" ){
            formErrors.score = "this field is required";
        }
        else if ( parseFloat(score) < 0 || parseFloat(score) > 5 ){
            formErrors.score = "score must be less than or equal 5";
        }
        else {
            formErrors.score = "";
        }

        this.setState({
            formErrors: formErrors
        })
    }

    handleChange = e => {
        const { name,value } = e.target
        this.setState({
            [name]: value
        })
    }

    isUserOwner = () => {
        return this.state.court.owner.username === this.props.user.username;
    }

    handleAddImage = async e => {
        e.preventDefault();
        this.validateAddImage();

        if ( this.isAddImageFormValid() ){
            try{
                let data = await uploadFileToS3(this.state.file, this.state.court.name + (new Date()).getTime(), "court_images");
                console.log(data);
                this.setState({
                    file: "",
                    imagePreviewUrl: ""
                });
            }
            catch(err){
                alert(err);
                console.error(err);
            }
        }
    }

    isAddImageFormValid = () => {
        return this.state.imageUploadError === "";
    }

    validateAddImage = () => {
        let imageUploadError = this.state.imageUploadError;

        if ( this.state.file === "" ){
            imageUploadError = "Please select your image to upload";
        }
        else {
            imageUploadError = "";
        }

        this.setState({
            imageUploadError: imageUploadError
        })
    }

    handleImageChange = (e) => {
        e.preventDefault();
    
        let reader = new FileReader();
        let file = e.target.files[0];
    
        reader.onloadend = () => {
          this.setState({
            file: file,
            imagePreviewUrl: reader.result
          });
        }
    
        reader.readAsDataURL(file)
      }

    render(){

        let addReviewSection;
        if ( this.state.loadFinish && !this.isUserOwner() ){
            addReviewSection = (
                <div className="my-4">
                    <h3>Add Review</h3>
                    <Form onSubmit={this.handleReview}>
                        <Form.Group className="text-left">
                            <Form.Label>score</Form.Label>
                            <Form.Control name="score" type="number" onChange={this.handleChange}></Form.Control>
                            <p className="error-form-field">{this.state.formErrors.score}</p>
                        </Form.Group>
                        <Form.Group className="text-left">
                            <Form.Label>review</Form.Label>
                            <textarea name='review' className="form-control" col="2" onChange={this.handleChange}></textarea>
                        </Form.Group>
                        <div className="text-right">
                            <button className="btn btn-primary" type="submit">add review</button>
                        </div>
                    </Form>
                </div>
            );
        }

        let addImageSection;
        if ( this.state.loadFinish &&  this.isUserOwner() ){
            addImageSection = (
                <div className="my-4">
                    <h3>Add Image</h3>
                    <Form onSubmit={this.handleAddImage}>
                        <Form.Group>
                            <Form.Control onChange={this.handleImageChange} name="image" type="file"></Form.Control>
                            <p className="error-form-field">{this.state.imageUploadError}</p>
                        </Form.Group>
                        {this.state.imagePreviewUrl === "" ? null : <img src={this.state.imagePreviewUrl}/>}
                        <div className="text-center">
                            <button type="submit" className="btn btn-primary">Upload</button>
                        </div>
                    </Form>
                </div>
            );
        }

        return (
            <div className="app-content-inner">
                <div className="container">
                    <h1>Court</h1>
                    {JSON.stringify(this.state.court)}
                    {addReviewSection}
                    {addImageSection}
                </div>  
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        user: state.auth.user
    };
}
  
const mapDispatchToProps = dispatch => {
    return {
        loadCourt: (courtName) => {
          return dispatch(courtActions.loadCourt(courtName));
        },
        reviewCourt: (courtName, score, review) => {
            return dispatch(courtActions.reviewCourt(courtName, score, review));
        }
      };
}

export default connect(mapStateToProps, mapDispatchToProps)(Court);